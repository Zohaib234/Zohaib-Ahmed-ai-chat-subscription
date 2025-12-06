/**
 * Chat message domain entity properties
 */
export interface ChatMessageProps {
  id?: string;
  userId: string;
  subscriptionId?: string;
  question: string;
  answer: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  usedFreeQuota: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chat message create properties
 */
export interface ChatMessageCreateProps {
  id?: string;
  userId: string;
  subscriptionId?: string;
  question: string;
  answer: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  usedFreeQuota: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Chat message database object
 */
export interface ChatMessageDO {
  id: string;
  user_id: string;
  subscription_id: string | null;
  question: string;
  answer: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  used_free_quota: boolean;
  created_at: Date;
  updated_at: Date;
}

class ChatMessage {
  public readonly id?: string;
  public readonly userId: string;
  public readonly subscriptionId?: string;
  public readonly question: string;
  public readonly answer: string;
  public readonly promptTokens: number;
  public readonly completionTokens: number;
  public readonly totalTokens: number;
  public readonly usedFreeQuota: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  /**
   * Constructor
   * @param props Chat message properties
   */
  constructor(props: ChatMessageProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.subscriptionId = props.subscriptionId;
    this.question = props.question;
    this.answer = props.answer;
    this.promptTokens = props.promptTokens;
    this.completionTokens = props.completionTokens;
    this.totalTokens = props.totalTokens;
    this.usedFreeQuota = props.usedFreeQuota;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new chat message
   * @param props Chat message create properties
   * @returns ChatMessage entity
   */
  static create(props: ChatMessageCreateProps): ChatMessage {
    const now = new Date();

    return new ChatMessage({
      id: props.id,
      userId: props.userId,
      subscriptionId: props.subscriptionId,
      question: props.question,
      answer: props.answer,
      promptTokens: props.promptTokens,
      completionTokens: props.completionTokens,
      totalTokens: props.totalTokens,
      usedFreeQuota: props.usedFreeQuota,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now
    });
  }

  /**
   * Creates chat message entity from database object
   * @param DO Database object
   * @returns ChatMessage entity
   */
  static fromDO(DO: ChatMessageDO): ChatMessage {
    return ChatMessage.create({
      id: DO.id,
      userId: DO.user_id,
      subscriptionId: DO.subscription_id ?? undefined,
      question: DO.question,
      answer: DO.answer,
      promptTokens: DO.prompt_tokens,
      completionTokens: DO.completion_tokens,
      totalTokens: DO.total_tokens,
      usedFreeQuota: DO.used_free_quota,
      createdAt: DO.created_at,
      updatedAt: DO.updated_at
    });
  }

  /**
   * Creates database object from chat message entity
   * @param entity ChatMessage entity
   * @returns Database object
   */
  static toDO(entity: ChatMessage): Omit<ChatMessageDO, "id"> {
    return {
      user_id: entity.userId,
      subscription_id: entity.subscriptionId ?? null,
      question: entity.question,
      answer: entity.answer,
      prompt_tokens: entity.promptTokens,
      completion_tokens: entity.completionTokens,
      total_tokens: entity.totalTokens,
      used_free_quota: entity.usedFreeQuota,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }
}

export default ChatMessage;
