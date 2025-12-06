import Subscription, { SubscriptionDO, SubscriptionStatus } from "../domains/subscription.js";
import PostgresClient from "../clients/postgres.js";
import Logger from "../utils/logger.js";

class SubscriptionRepository {
  private db: PostgresClient;
  private logger: Logger;

  /**
   * Constructor
   * @param db PostgreSQL client
   * @param logger Logger instance
   */
  constructor(db: PostgresClient, logger: Logger) {
    this.db = db;
    this.logger = logger.child("SubscriptionRepository");
  }

  /**
   * Save a new subscription
   * @param subscription Subscription entity
   * @returns Created subscription entity
   */
  async save(subscription: Subscription): Promise<Subscription> {
    const DO = Subscription.toDO(subscription);

    const result = await this.db.query<SubscriptionDO>(
      `INSERT INTO subscriptions 
       (user_id, tier, billing_cycle, max_messages, messages_used, price, start_date, end_date, renewal_date, auto_renew, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        DO.user_id, DO.tier, DO.billing_cycle, DO.max_messages, DO.messages_used,
        DO.price, DO.start_date, DO.end_date, DO.renewal_date, DO.auto_renew,
        DO.status, DO.created_at, DO.updated_at
      ]
    );

    this.logger.info("Subscription created", { userId: subscription.userId, tier: subscription.tier });
    return Subscription.fromDO(result.rows[0]);
  }

  /**
   * Get subscription by ID
   * @param id Subscription ID
   * @returns Subscription entity or null
   */
  async getById(id: string): Promise<Subscription | null> {
    const result = await this.db.query<SubscriptionDO>(
      `SELECT * FROM subscriptions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Subscription.fromDO(result.rows[0]);
  }

  /**
   * Get all active subscriptions for user
   * @param userId User ID
   * @returns Array of active subscription entities
   */
  async getActiveByUserId(userId: string): Promise<Subscription[]> {
    const result = await this.db.query<SubscriptionDO>(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => Subscription.fromDO(row));
  }

  /**
   * Get all subscriptions for user (including inactive)
   * @param userId User ID
   * @returns Array of subscription entities
   */
  async getAllByUserId(userId: string): Promise<Subscription[]> {
    const result = await this.db.query<SubscriptionDO>(
      `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => Subscription.fromDO(row));
  }

  /**
   * Get active subscription with remaining quota
   * @param userId User ID
   * @returns Subscription with quota or null
   */
  async getActiveWithQuota(userId: string): Promise<Subscription | null> {
    const result = await this.db.query<SubscriptionDO>(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 
         AND status = 'active' 
         AND end_date > CURRENT_TIMESTAMP
         AND (max_messages = -1 OR messages_used < max_messages)
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Subscription.fromDO(result.rows[0]);
  }

  /**
   * Increment messages used
   * @param subscriptionId Subscription ID
   * @returns Updated subscription entity
   */
  async incrementMessagesUsed(subscriptionId: string): Promise<Subscription | null> {
    const result = await this.db.query<SubscriptionDO>(
      `UPDATE subscriptions 
       SET messages_used = messages_used + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [subscriptionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    this.logger.info("Subscription messages incremented", { subscriptionId });
    return Subscription.fromDO(result.rows[0]);
  }

  /**
   * Update subscription status
   * @param subscriptionId Subscription ID
   * @param status New status
   * @returns Updated subscription entity
   */
  async updateStatus(subscriptionId: string, status: SubscriptionStatus): Promise<Subscription | null> {
    const result = await this.db.query<SubscriptionDO>(
      `UPDATE subscriptions 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, subscriptionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    this.logger.info("Subscription status updated", { subscriptionId, status });
    return Subscription.fromDO(result.rows[0]);
  }

  /**
   * Toggle auto-renew
   * @param subscriptionId Subscription ID
   * @param autoRenew Auto-renew setting
   * @returns Updated subscription entity
   */
  async updateAutoRenew(subscriptionId: string, autoRenew: boolean): Promise<Subscription | null> {
    const result = await this.db.query<SubscriptionDO>(
      `UPDATE subscriptions 
       SET auto_renew = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [autoRenew, subscriptionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    this.logger.info("Subscription auto-renew updated", { subscriptionId, autoRenew });
    return Subscription.fromDO(result.rows[0]);
  }

  /**
   * Get subscriptions due for renewal
   * @returns Array of subscriptions due for renewal
   */
  async getSubscriptionsDueForRenewal(): Promise<Subscription[]> {
    const result = await this.db.query<SubscriptionDO>(
      `SELECT * FROM subscriptions 
       WHERE status = 'active' 
         AND auto_renew = true 
         AND renewal_date <= CURRENT_TIMESTAMP`,
      []
    );

    return result.rows.map((row) => Subscription.fromDO(row));
  }

  /**
   * Renew subscription
   * @param subscriptionId Subscription ID
   * @returns Updated subscription entity
   */
  async renewSubscription(subscriptionId: string): Promise<Subscription | null> {
    const subscription = await this.getById(subscriptionId);
    if (!subscription) return null;

    const monthsToAdd = subscription.billingCycle === "yearly" ? 12 : 1;
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

    const result = await this.db.query<SubscriptionDO>(
      `UPDATE subscriptions 
       SET end_date = $1, renewal_date = $1, messages_used = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newEndDate, subscriptionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    this.logger.info("Subscription renewed", { subscriptionId });
    return Subscription.fromDO(result.rows[0]);
  }

  /**
   * Cancel subscription
   * @param subscriptionId Subscription ID
   * @returns Updated subscription entity
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription | null> {
    const result = await this.db.query<SubscriptionDO>(
      `UPDATE subscriptions 
       SET status = 'cancelled', auto_renew = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [subscriptionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    this.logger.info("Subscription cancelled", { subscriptionId });
    return Subscription.fromDO(result.rows[0]);
  }
}

export default SubscriptionRepository;
