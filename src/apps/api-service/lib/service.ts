import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import Logger from "../../packages/utils/logger.js";
import PostgresClient from "../../packages/clients/postgres.js";
import OpenAIClient from "../../packages/clients/openai.js";
import UserRepository from "../../packages/repositories/user.js";
import SubscriptionRepository from "../../packages/repositories/subscription.js";
import ChatMessageRepository from "../../packages/repositories/chat-message.js";
import { APIException } from "../../packages/utils/exception.js";

// Routes
import HealthController from "./lib/routes/health/index.js";
import RegisterController from "./lib/routes/auth/register.js";
import LoginController from "./lib/routes/auth/login.js";
import SendMessageController from "./lib/routes/chat/send.js";
import GetChatHistoryController from "./lib/routes/chat/history.js";
import CreateSubscriptionController from "./lib/routes/subscriptions/create.js";
import ListSubscriptionsController from "./lib/routes/subscriptions/list.js";
import CancelSubscriptionController from "./lib/routes/subscriptions/cancel.js";

interface ServiceConfig {
  port: number;
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

class Service {
  public app: Express;
  public config: ServiceConfig;
  public logger: Logger;
  public postgresClient: PostgresClient;
  public openaiClient: OpenAIClient;
  public userRepository!: UserRepository;
  public subscriptionRepository!: SubscriptionRepository;
  public chatMessageRepository!: ChatMessageRepository;

  /**
   * Constructor
   * @param config Service configuration
   */
  constructor(config: ServiceConfig) {
    this.config = config;
    this.logger = new Logger({ level: "info", prefix: "Service" });
    this.app = express();
    this.postgresClient = new PostgresClient(config.database, this.logger);
    this.openaiClient = new OpenAIClient(this.logger);
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(morgan("combined"));
  }

  /**
   * Initialize repositories
   */
  private initializeRepositories(): void {
    this.userRepository = new UserRepository(this.postgresClient, this.logger);
    this.subscriptionRepository = new SubscriptionRepository(this.postgresClient, this.logger);
    this.chatMessageRepository = new ChatMessageRepository(this.postgresClient, this.logger);
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health
    HealthController.create(this).initialize();

    // Auth
    RegisterController.create(this).initialize();
    LoginController.create(this).initialize();

    // Chat
    SendMessageController.create(this).initialize();
    GetChatHistoryController.create(this).initialize();

    // Subscriptions
    CreateSubscriptionController.create(this).initialize();
    ListSubscriptionsController.create(this).initialize();
    CancelSubscriptionController.create(this).initialize();
  }

  /**
   * Initialize error handler
   */
  private initializeErrorHandler(): void {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      this.logger.error("Unhandled error", {
        error: err.message,
        stack: err.stack
      });

      if (err instanceof APIException) {
        return res.status(err.statusCode).json({
          message: err.message,
          error: err.name,
          ...(err.name === "QuotaExceededException" && {
            remainingFreeMessages: (err as any).remainingFreeMessages,
            hasActiveSubscription: (err as any).hasActiveSubscription
          })
        });
      }

      return res.status(500).json({
        message: "Internal server error",
        error: "InternalServerException"
      });
    });
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    await this.postgresClient.connect();
    await this.postgresClient.initializeTables();
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    this.initializeMiddleware();
    this.initializeRepositories();
    this.initializeRoutes();
    this.initializeErrorHandler();

    await this.connect();

    this.app.listen(this.config.port, () => {
      this.logger.info(`Server started on port ${this.config.port}`);
    });
  }
}

export default Service;
