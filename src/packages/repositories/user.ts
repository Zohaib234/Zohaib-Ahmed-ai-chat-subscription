import User, { UserDO } from "../domains/user.js";
import PostgresClient from "../clients/postgres.js";
import Logger from "../utils/logger.js";

class UserRepository {
  private db: PostgresClient;
  private logger: Logger;

  /**
   * Constructor
   * @param db PostgreSQL client
   * @param logger Logger instance
   */
  constructor(db: PostgresClient, logger: Logger) {
    this.db = db;
    this.logger = logger.child("UserRepository");
  }

  /**
   * Save a new user
   * @param user User entity
   * @returns Created user entity
   */
  async save(user: User): Promise<User> {
    const DO = User.toDO(user);

    const result = await this.db.query<UserDO>(
      `INSERT INTO users (email, password, name, free_messages_used, free_messages_reset_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [DO.email, DO.password, DO.name, DO.free_messages_used, DO.free_messages_reset_at, DO.created_at, DO.updated_at]
    );

    this.logger.info("User created", { email: user.email });
    return User.fromDO(result.rows[0]);
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns User entity or null
   */
  async getById(id: string): Promise<User | null> {
    const result = await this.db.query<UserDO>(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromDO(result.rows[0]);
  }

  /**
   * Get user by email
   * @param email User email
   * @returns User entity or null
   */
  async getByEmail(email: string): Promise<User | null> {
    const result = await this.db.query<UserDO>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromDO(result.rows[0]);
  }

  /**
   * Increment free messages used
   * @param userId User ID
   * @returns Updated user entity
   */
  async incrementFreeMessagesUsed(userId: string): Promise<User | null> {
    const result = await this.db.query<UserDO>(
      `UPDATE users 
       SET free_messages_used = free_messages_used + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    this.logger.info("Free messages incremented", { userId });
    return User.fromDO(result.rows[0]);
  }

  /**
   * Reset free messages quota
   * @param userId User ID
   * @returns Updated user entity
   */
  async resetFreeMessages(userId: string): Promise<User | null> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const result = await this.db.query<UserDO>(
      `UPDATE users 
       SET free_messages_used = 0, free_messages_reset_at = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [firstOfMonth, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    this.logger.info("Free messages reset", { userId });
    return User.fromDO(result.rows[0]);
  }

  /**
   * Update user
   * @param user User entity
   * @returns Updated user entity
   */
  async update(user: User): Promise<User | null> {
    const result = await this.db.query<UserDO>(
      `UPDATE users 
       SET email = $1, name = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [user.email, user.name, user.id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromDO(result.rows[0]);
  }
}

export default UserRepository;
