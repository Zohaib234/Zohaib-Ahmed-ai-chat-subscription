import { Request, Response, NextFunction, Express } from "express";
import CreateSubscriptionDTOValidator from "../../lib/dtos/create-subscription.js";
import SubscriptionMapper from "../../lib/mappers/subscription.js";
import ProtectRoute from "../../lib/middlewares/protect-route.js";
import CreateSubscriptionUseCase from "../../../packages/use-cases/create-subscription.js";
import Logger from "../../../packages/utils/logger.js";

interface ServiceConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

interface CreateSubscriptionControllerDeps {
  app: Express;
  config: ServiceConfig;
  createSubscriptionUseCase: CreateSubscriptionUseCase;
  logger: Logger;
}

class CreateSubscriptionController {
  private app: Express;
  private config: ServiceConfig;
  private createSubscriptionUseCase: CreateSubscriptionUseCase;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: CreateSubscriptionControllerDeps) {
    if (!(deps.logger instanceof Logger)) {
      throw new TypeError("Logger must be provided");
    }

    this.app = deps.app;
    this.config = deps.config;
    this.createSubscriptionUseCase = deps.createSubscriptionUseCase;
    this.logger = deps.logger;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns CreateSubscriptionController instance
   */
  static create(server: {
    app: Express;
    config: ServiceConfig;
    subscriptionRepository: any;
    userRepository: any;
    logger: Logger;
  }): CreateSubscriptionController {
    return new CreateSubscriptionController({
      app: server.app,
      config: server.config,
      createSubscriptionUseCase: CreateSubscriptionUseCase.create({
        subscriptionRepository: server.subscriptionRepository,
        userRepository: server.userRepository,
        logger: server.logger
      }),
      logger: server.logger
    });
  }

  /**
   * Initialize routes
   */
  initialize(): void {
    this.app.post(
      "/v1/subscriptions",
      ProtectRoute.bind(this)(),
      this.handleCreateSubscription.bind(this)
    );
  }

  /**
   * Handle create subscription request
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async handleCreateSubscription(
    req: Request & { userId?: string },
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { dto, errors } = CreateSubscriptionDTOValidator.create(req.body);

      if (errors.length > 0) {
        return res.status(422).json({
          message: "Validation failed",
          errors
        });
      }

      const userId = req.userId!;

      const { subscription } = await this.createSubscriptionUseCase.execute({
        userId,
        tier: dto.tier,
        billingCycle: dto.billingCycle,
        autoRenew: dto.autoRenew
      });

      const mappedSubscription = SubscriptionMapper.toResponse(subscription);

      return res.status(201).json({
        message: "Subscription created successfully",
        subscription: mappedSubscription
      });
    }
    catch (err) {
      next(err);
    }
  }
}

export default CreateSubscriptionController;
