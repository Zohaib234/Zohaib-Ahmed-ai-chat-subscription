import { Request, Response, NextFunction, Express } from "express";
import ChatMessageMapper from "../../lib/mappers/chat-message.js";
import ProtectRoute from "../../lib/middlewares/protect-route.js";
import ChatMessageRepository from "../../../packages/repositories/chat-message.js";
import Logger from "../../../packages/utils/logger.js";

interface ServiceConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

interface GetChatHistoryControllerDeps {
  app: Express;
  config: ServiceConfig;
  chatMessageRepository: ChatMessageRepository;
  logger: Logger;
}

class GetChatHistoryController {
  private app: Express;
  private config: ServiceConfig;
  private chatMessageRepository: ChatMessageRepository;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: GetChatHistoryControllerDeps) {
    if (!(deps.logger instanceof Logger)) {
      throw new TypeError("Logger must be provided");
    }

    this.app = deps.app;
    this.config = deps.config;
    this.chatMessageRepository = deps.chatMessageRepository;
    this.logger = deps.logger;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns GetChatHistoryController instance
   */
  static create(server: {
    app: Express;
    config: ServiceConfig;
    chatMessageRepository: ChatMessageRepository;
    logger: Logger;
  }): GetChatHistoryController {
    return new GetChatHistoryController({
      app: server.app,
      config: server.config,
      chatMessageRepository: server.chatMessageRepository,
      logger: server.logger
    });
  }

  /**
   * Initialize routes
   */
  initialize(): void {
    this.app.get(
      "/v1/chat/history",
      ProtectRoute.bind(this)(),
      this.handleGetHistory.bind(this)
    );
  }

  /**
   * Handle get history request
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async handleGetHistory(
    req: Request & { userId?: string },
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const messages = await this.chatMessageRepository.getByUserId(userId, limit, offset);
      const mappedMessages = ChatMessageMapper.toResponseArray(messages);

      return res.status(200).json({
        message: "Chat history retrieved",
        chatMessages: mappedMessages,
        pagination: {
          limit,
          offset,
          count: mappedMessages.length
        }
      });
    }
    catch (err) {
      next(err);
    }
  }
}

export default GetChatHistoryController;
