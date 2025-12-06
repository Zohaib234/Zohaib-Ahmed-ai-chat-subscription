import { Pool, PoolClient, QueryResult } from "pg";
import Logger from "../utils/logger.js";

interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
}

class PostgresClient {
  private pool: Pool | null = null;
  private logger: Logger;
  private config: PostgresConfig;

  /**
   * Constructor
   * @param config Postgres configuration
   * @param logger Logger instance
   */
  constructor(config: PostgresConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.child("PostgresClient");
  }

  /**
   * Connect to PostgreSQL
   */
  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        max: this.config.max ?? 20
      });

      // Test connection
      const client = await this.pool.connect();
      client.release();

      this.logger.info("PostgreSQL connected successfully");
    }
    catch (error) {
      this.logger.error("PostgreSQL connection failed", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  /**
   * Execute query
   * @param text SQL query
   * @param params Query parameters
   * @returns Query result
   */
  async query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error("PostgreSQL not connected");
    }

    const start = Date.now();
    const result = await this.pool.query<T>(text, params);
    const duration = Date.now() - start;

    this.logger.debug("Query executed", {
      query: text,
      duration,
      rows: result.rowCount
    });

    return result;
  }

  /**
   * Get client from pool for transactions
   * @returns Pool client
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error("PostgreSQL not connected");
    }
    return this.pool.connect();
  }

  /**
   * Disconnect from PostgreSQL
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.info("PostgreSQL disconnected");
    }
  }

  /**
   * Initialize database tables
   */
  async initializeTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        free_messages_used INTEGER DEFAULT 0,
        free_messages_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSubscriptionsTable = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tier VARCHAR(50) NOT NULL CHECK (tier IN ('basic', 'pro', 'enterprise')),
        billing_cycle VARCHAR(50) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
        max_messages INTEGER NOT NULL,
        messages_used INTEGER DEFAULT 0,
        price DECIMAL(10, 2) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        renewal_date TIMESTAMP NOT NULL,
        auto_renew BOOLEAN DEFAULT true,
        status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createChatMessagesTable = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL,
        completion_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        used_free_quota BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_subscription_id ON chat_messages(subscription_id);
    `;

    await this.query(createUsersTable);
    await this.query(createSubscriptionsTable);
    await this.query(createChatMessagesTable);
    await this.query(createIndexes);

    this.logger.info("Database tables initialized");
  }
}

export default PostgresClient;
