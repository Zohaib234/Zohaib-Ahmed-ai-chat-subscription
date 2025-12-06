import ChatMessage from "../../../packages/domains/chat-message.js";

interface MappedChatMessage {
  id: string;
  userId: string;
  subscriptionId?: string;
  question: string;
  answer: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  usedFreeQuota: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class ChatMessageMapper {
  /**
   * Maps a chat message entity to a response object
   * @param message ChatMessage entity
   * @returns Mapped chat message
   */
  static toResponse(message: ChatMessage): MappedChatMessage {
    return {
      id: message.id!,
      userId: message.userId,
      subscriptionId: message.subscriptionId,
      question: message.question,
      answer: message.answer,
      tokens: {
        prompt: message.promptTokens,
        completion: message.completionTokens,
        total: message.totalTokens
      },
      usedFreeQuota: message.usedFreeQuota,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }

  /**
   * Maps multiple chat message entities to response objects
   * @param messages Array of chat message entities
   * @returns Array of mapped chat messages
   */
  static toResponseArray(messages: ChatMessage[]): MappedChatMessage[] {
    return messages.map((message) => this.toResponse(message));
  }
}

export default ChatMessageMapper;
