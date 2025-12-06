import { Request, Response, NextFunction, Express } from "express";
import SubscriptionMapper from "../../lib/mappers/subscription.js";
import ProtectRoute from "../../lib/middlewares/protect-route.js";
import SubscriptionRepository from "../../../packages/repositories/subscription.js";
import Logger from "../../../packages/utils/logger.js";

interface ServiceConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

interface ListSubscriptionsControllerDeps {
  app: Express;
  config: ServiceConfig;
  subscriptionRepository: SubscriptionRepository;
  logger: Logger;
}

class ListSubscriptionsController {
  private app: Express;
  private config: ServiceConfig;
  private subscriptionRepository: SubscriptionRepository;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: ListSubscriptionsControllerDeps) {
    if (!(deps.logger instanceof Logger)) {
      throw new TypeError("Logger must be provided");
    }

    this.app = deps.app;
    this.config = deps.config;
    this.subscriptionRepository = deps.subscriptionRepository;
    this.logger = deps.logger;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns ListSubscriptionsController instance
   */
  static create(server: {
    app: Express;
    config: ServiceConfig;
    subscriptionRepository: SubscriptionRepository;
    logger: Logger;
  }): ListSubscriptionsController {
    return new ListSubscriptionsController({
      app: server.app,
      config: server.config,
      subscriptionRepository: server.subscriptionRepository,
      logger: server.logger
    });
  }

  /**
   * Initialize routes
   */
  initialize(): void {
    this.app.get(
      "/v1/subscriptions",
      ProtectRoute.bind(this)(),
      this.handleListSubscriptions.bind(this)
    );
  }

  /**
   * Handle list subscriptions request
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async handleListSubscriptions(
    req: Request & { userId?: string },
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.userId!;
      const activeOnly = req.query.active === "true";

      const subscriptions = activeOnly
        ? await this.subscriptionRepository.getActiveByUserId(userId)
        : await this.subscriptionRepository.getAllByUserId(userId);

      const mappedSubscriptions = SubscriptionMapper.toResponseArray(subscriptions);

      return res.status(200).json({
        message: "Subscriptions retrieved",
        subscriptions: mappedSubscriptions
      });
    }
    catch (err) {
      next(err);
    }
  }
}

export default ListSubscriptionsController;
