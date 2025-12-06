import ChatMessage from "../domains/chat-message.js";
import ChatMessageRepository from "../repositories/chat-message.js";
import SubscriptionRepository from "../repositories/subscription.js";
import UserRepository from "../repositories/user.js";
import OpenAIClient from "../clients/openai.js";
import Logger from "../utils/logger.js";
import { NotFoundException, QuotaExceededException } from "../utils/exception.js";

interface SendMessageParams {
  userId: string;
  question: string;
}

interface SendMessageResult {
  chatMessage: ChatMessage;
  usedFreeQuota: boolean;
  subscriptionId?: string;
}

interface SendMessageDeps {
  chatMessageRepository: ChatMessageRepository;
  subscriptionRepository: SubscriptionRepository;
  userRepository: UserRepository;
  openaiClient: OpenAIClient;
  logger: Logger;
}

const FREE_MESSAGES_LIMIT = 3;

class SendMessageUseCase {
  private chatMessageRepository: ChatMessageRepository;
  private subscriptionRepository: SubscriptionRepository;
  private userRepository: UserRepository;
  private openaiClient: OpenAIClient;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: SendMessageDeps) {
    this.chatMessageRepository = deps.chatMessageRepository;
    this.subscriptionRepository = deps.subscriptionRepository;
    this.userRepository = deps.userRepository;
    this.openaiClient = deps.openaiClient;
    this.logger = deps.logger.child("SendMessageUseCase");
  }

  /**
   * Creates an instance
   * @param deps Dependencies
   * @returns SendMessageUseCase instance
   */
  static create(deps: SendMessageDeps): SendMessageUseCase {
    return new SendMessageUseCase(deps);
  }

  /**
   * Execute use case
   * @param params Send message params
   * @returns Send message result
   */
  async execute(params: SendMessageParams): Promise<SendMessageResult> {
    this.logger.info("Processing message", { userId: params.userId });

    // Get user
    let user = await this.userRepository.getById(params.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if free messages need to be reset (1st of month)
    if (user.shouldResetFreeMessages()) {
      user = await this.userRepository.resetFreeMessages(params.userId);
      if (!user) {
        throw new NotFoundException("User not found after reset");
      }
      this.logger.info("Free messages reset for user", { userId: params.userId });
    }

    let usedFreeQuota = false;
    let subscriptionId: string | undefined;

    // Check if user has free messages remaining
    if (user.hasFreeMessages()) {
      usedFreeQuota = true;
      await this.userRepository.incrementFreeMessagesUsed(params.userId);
      this.logger.info("Using free quota", {
        userId: params.userId,
        freeMessagesUsed: user.freeMessagesUsed + 1
      });
    }
    else {
      // Check for active subscription with quota
      const subscription = await this.subscriptionRepository.getActiveWithQuota(params.userId);

      if (!subscription) {
        // Check if user has any active subscriptions
        const activeSubscriptions = await this.subscriptionRepository.getActiveByUserId(params.userId);
        const hasActiveSubscription = activeSubscriptions.length > 0;

        throw new QuotaExceededException(
          "You have exceeded your message quota. Please purchase a subscription bundle.",
          FREE_MESSAGES_LIMIT - user.freeMessagesUsed,
          hasActiveSubscription
        );
      }

      subscriptionId = subscription.id;
      await this.subscriptionRepository.incrementMessagesUsed(subscription.id!);
      this.logger.info("Using subscription quota", {
        userId: params.userId,
        subscriptionId: subscription.id,
        tier: subscription.tier
      });
    }

    // Send message to OpenAI (mocked)
    const response = await this.openaiClient.sendMessage(params.question);

    // Create and save chat message
    const chatMessage = ChatMessage.create({
      userId: params.userId,
      subscriptionId,
      question: params.question,
      answer: response.answer,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      totalTokens: response.totalTokens,
      usedFreeQuota
    });

    const savedMessage = await this.chatMessageRepository.save(chatMessage);

    this.logger.info("Message processed successfully", {
      userId: params.userId,
      messageId: savedMessage.id,
      usedFreeQuota
    });

    return {
      chatMessage: savedMessage,
      usedFreeQuota,
      subscriptionId
    };
  }
}

export default SendMessageUseCase;
