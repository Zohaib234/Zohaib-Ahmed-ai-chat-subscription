import { Request, Response, NextFunction, Express } from "express";
import SendMessageDTOValidator from "../../lib/dtos/send-message.js";
import ChatMessageMapper from "../../lib/mappers/chat-message.js";
import ProtectRoute from "../../lib/middlewares/protect-route.js";
import SendMessageUseCase from "../../../packages/use-cases/send-message.js";
import Logger from "../../../packages/utils/logger.js";

interface ServiceConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

interface SendMessageControllerDeps {
  app: Express;
  config: ServiceConfig;
  sendMessageUseCase: SendMessageUseCase;
  logger: Logger;
}

class SendMessageController {
  private app: Express;
  private config: ServiceConfig;
  private sendMessageUseCase: SendMessageUseCase;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: SendMessageControllerDeps) {
    if (!(deps.logger instanceof Logger)) {
      throw new TypeError("Logger must be provided");
    }

    this.app = deps.app;
    this.config = deps.config;
    this.sendMessageUseCase = deps.sendMessageUseCase;
    this.logger = deps.logger;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns SendMessageController instance
   */
  static create(server: {
    app: Express;
    config: ServiceConfig;
    chatMessageRepository: any;
    subscriptionRepository: any;
    userRepository: any;
    openaiClient: any;
    logger: Logger;
  }): SendMessageController {
    return new SendMessageController({
      app: server.app,
      config: server.config,
      sendMessageUseCase: SendMessageUseCase.create({
        chatMessageRepository: server.chatMessageRepository,
        subscriptionRepository: server.subscriptionRepository,
        userRepository: server.userRepository,
        openaiClient: server.openaiClient,
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
      "/v1/chat/send",
      ProtectRoute.bind(this)(),
      this.handleSendMessage.bind(this)
    );
  }

  /**
   * Handle send message request
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async handleSendMessage(
    req: Request & { userId?: string },
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { dto, errors } = SendMessageDTOValidator.create(req.body);

      if (errors.length > 0) {
        return res.status(422).json({
          message: "Validation failed",
          errors
        });
      }

      const userId = req.userId!;

      const { chatMessage, usedFreeQuota, subscriptionId } = await this.sendMessageUseCase.execute({
        userId,
        question: dto.question
      });

      const mappedMessage = ChatMessageMapper.toResponse(chatMessage);

      return res.status(200).json({
        message: "Message sent successfully",
        chatMessage: mappedMessage,
        usedFreeQuota,
        subscriptionId
      });
    }
    catch (err) {
      next(err);
    }
  }
}

export default SendMessageController;
