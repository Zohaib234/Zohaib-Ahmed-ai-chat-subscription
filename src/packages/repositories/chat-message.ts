import ChatMessage, { ChatMessageDO } from "../domains/chat-message.js";
import PostgresClient from "../clients/postgres.js";
import Logger from "../utils/logger.js";

class ChatMessageRepository {
  private db: PostgresClient;
  private logger: Logger;

  /**
   * Constructor
   * @param db PostgreSQL client
   * @param logger Logger instance
   */
  constructor(db: PostgresClient, logger: Logger) {
    this.db = db;
    this.logger = logger.child("ChatMessageRepository");
  }

  /**
   * Save a new chat message
   * @param message ChatMessage entity
   * @returns Created chat message entity
   */
  async save(message: ChatMessage): Promise<ChatMessage> {
    const DO = ChatMessage.toDO(message);

    const result = await this.db.query<ChatMessageDO>(
      `INSERT INTO chat_messages 
       (user_id, subscription_id, question, answer, prompt_tokens, completion_tokens, total_tokens, used_free_quota, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        DO.user_id, DO.subscription_id, DO.question, DO.answer,
        DO.prompt_tokens, DO.completion_tokens, DO.total_tokens,
        DO.used_free_quota, DO.created_at, DO.updated_at
      ]
    );

    this.logger.info("Chat message saved", { userId: message.userId });
    return ChatMessage.fromDO(result.rows[0]);
  }

  /**
   * Get chat message by ID
   * @param id Message ID
   * @returns ChatMessage entity or null
   */
  async getById(id: string): Promise<ChatMessage | null> {
    const result = await this.db.query<ChatMessageDO>(
      `SELECT * FROM chat_messages WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return ChatMessage.fromDO(result.rows[0]);
  }

  /**
   * Get all chat messages for user
   * @param userId User ID
   * @param limit Limit (default 50)
   * @param offset Offset (default 0)
   * @returns Array of chat message entities
   */
  async getByUserId(userId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    const result = await this.db.query<ChatMessageDO>(
      `SELECT * FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map((row) => ChatMessage.fromDO(row));
  }

  /**
   * Get chat messages by subscription
   * @param subscriptionId Subscription ID
   * @returns Array of chat message entities
   */
  async getBySubscriptionId(subscriptionId: string): Promise<ChatMessage[]> {
    const result = await this.db.query<ChatMessageDO>(
      `SELECT * FROM chat_messages 
       WHERE subscription_id = $1 
       ORDER BY created_at DESC`,
      [subscriptionId]
    );

    return result.rows.map((row) => ChatMessage.fromDO(row));
  }

  /**
   * Get total tokens used by user
   * @param userId User ID
   * @returns Total tokens used
   */
  async getTotalTokensByUserId(userId: string): Promise<number> {
    const result = await this.db.query<{ total: string }>(
      `SELECT COALESCE(SUM(total_tokens), 0) as total FROM chat_messages WHERE user_id = $1`,
      [userId]
    );

    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Get message count by user for current month
   * @param userId User ID
   * @returns Message count
   */
  async getMonthlyCountByUserId(userId: string): Promise<number> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM chat_messages 
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, firstOfMonth]
    );

    return parseInt(result.rows[0].count, 10);
  }
}

export default ChatMessageRepository;
