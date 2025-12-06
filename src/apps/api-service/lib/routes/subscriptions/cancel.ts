import { Request, Response, NextFunction, Express } from "express";
import SubscriptionMapper from "../../lib/mappers/subscription.js";
import ProtectRoute from "../../lib/middlewares/protect-route.js";
import CancelSubscriptionUseCase from "../../../packages/use-cases/cancel-subscription.js";
import Logger from "../../../packages/utils/logger.js";

interface ServiceConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

interface CancelSubscriptionControllerDeps {
  app: Express;
  config: ServiceConfig;
  cancelSubscriptionUseCase: CancelSubscriptionUseCase;
  logger: Logger;
}

class CancelSubscriptionController {
  private app: Express;
  private config: ServiceConfig;
  private cancelSubscriptionUseCase: CancelSubscriptionUseCase;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: CancelSubscriptionControllerDeps) {
    if (!(deps.logger instanceof Logger)) {
      throw new TypeError("Logger must be provided");
    }

    this.app = deps.app;
    this.config = deps.config;
    this.cancelSubscriptionUseCase = deps.cancelSubscriptionUseCase;
    this.logger = deps.logger;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns CancelSubscriptionController instance
   */
  static create(server: {
    app: Express;
    config: ServiceConfig;
    subscriptionRepository: any;
    logger: Logger;
  }): CancelSubscriptionController {
    return new CancelSubscriptionController({
      app: server.app,
      config: server.config,
      cancelSubscriptionUseCase: CancelSubscriptionUseCase.create({
        subscriptionRepository: server.subscriptionRepository,
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
      "/v1/subscriptions/:id/cancel",
      ProtectRoute.bind(this)(),
      this.handleCancelSubscription.bind(this)
    );
  }

  /**
   * Handle cancel subscription request
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async handleCancelSubscription(
    req: Request & { userId?: string },
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.userId!;
      const subscriptionId = req.params.id;

      const { subscription } = await this.cancelSubscriptionUseCase.execute({
        subscriptionId,
        userId
      });

      const mappedSubscription = SubscriptionMapper.toResponse(subscription);

      return res.status(200).json({
        message: "Subscription cancelled successfully",
        subscription: mappedSubscription
      });
    }
    catch (err) {
      next(err);
    }
  }
}

export default CancelSubscriptionController;
