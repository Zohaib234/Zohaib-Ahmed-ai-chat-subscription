/**
 * Subscription tier types
 */
export type SubscriptionTier = "basic" | "pro" | "enterprise";

/**
 * Billing cycle types
 */
export type BillingCycle = "monthly" | "yearly";

/**
 * Subscription status types
 */
export type SubscriptionStatus = "active" | "inactive" | "cancelled";

/**
 * Subscription domain entity properties
 */
export interface SubscriptionProps {
  id?: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  maxMessages: number;
  messagesUsed: number;
  price: number;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription create properties
 */
export interface SubscriptionCreateProps {
  id?: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  autoRenew?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Subscription database object
 */
export interface SubscriptionDO {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  max_messages: number;
  messages_used: number;
  price: number;
  start_date: Date;
  end_date: Date;
  renewal_date: Date;
  auto_renew: boolean;
  status: SubscriptionStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Tier configuration
 */
const TIER_CONFIG: Record<SubscriptionTier, { maxMessages: number; monthlyPrice: number }> = {
  basic: { maxMessages: 10, monthlyPrice: 9.99 },
  pro: { maxMessages: 100, monthlyPrice: 29.99 },
  enterprise: { maxMessages: -1, monthlyPrice: 99.99 } // -1 = unlimited
};

class Subscription {
  public readonly id?: string;
  public readonly userId: string;
  public readonly tier: SubscriptionTier;
  public readonly billingCycle: BillingCycle;
  public readonly maxMessages: number;
  public readonly messagesUsed: number;
  public readonly price: number;
  public readonly startDate: Date;
  public readonly endDate: Date;
  public readonly renewalDate: Date;
  public readonly autoRenew: boolean;
  public readonly status: SubscriptionStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  /**
   * Constructor
   * @param props Subscription properties
   */
  constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tier = props.tier;
    this.billingCycle = props.billingCycle;
    this.maxMessages = props.maxMessages;
    this.messagesUsed = props.messagesUsed;
    this.price = props.price;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.renewalDate = props.renewalDate;
    this.autoRenew = props.autoRenew;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new subscription
   * @param props Subscription create properties
   * @returns Subscription entity
   */
  static create(props: SubscriptionCreateProps): Subscription {
    const now = new Date();
    const tierConfig = TIER_CONFIG[props.tier];

    const monthsToAdd = props.billingCycle === "yearly" ? 12 : 1;
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + monthsToAdd);

    const price = props.billingCycle === "yearly"
      ? tierConfig.monthlyPrice * 12 * 0.8 // 20% discount for yearly
      : tierConfig.monthlyPrice;

    return new Subscription({
      id: props.id,
      userId: props.userId,
      tier: props.tier,
      billingCycle: props.billingCycle,
      maxMessages: tierConfig.maxMessages,
      messagesUsed: 0,
      price,
      startDate: now,
      endDate,
      renewalDate: endDate,
      autoRenew: props.autoRenew ?? true,
      status: "active",
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now
    });
  }

  /**
   * Creates subscription entity from database object
   * @param DO Database object
   * @returns Subscription entity
   */
  static fromDO(DO: SubscriptionDO): Subscription {
    return new Subscription({
      id: DO.id,
      userId: DO.user_id,
      tier: DO.tier,
      billingCycle: DO.billing_cycle,
      maxMessages: DO.max_messages,
      messagesUsed: DO.messages_used,
      price: DO.price,
      startDate: DO.start_date,
      endDate: DO.end_date,
      renewalDate: DO.renewal_date,
      autoRenew: DO.auto_renew,
      status: DO.status,
      createdAt: DO.created_at,
      updatedAt: DO.updated_at
    });
  }

  /**
   * Creates database object from subscription entity
   * @param entity Subscription entity
   * @returns Database object
   */
  static toDO(entity: Subscription): Omit<SubscriptionDO, "id"> {
    return {
      user_id: entity.userId,
      tier: entity.tier,
      billing_cycle: entity.billingCycle,
      max_messages: entity.maxMessages,
      messages_used: entity.messagesUsed,
      price: entity.price,
      start_date: entity.startDate,
      end_date: entity.endDate,
      renewal_date: entity.renewalDate,
      auto_renew: entity.autoRenew,
      status: entity.status,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Check if subscription has remaining messages
   * @returns True if has remaining messages
   */
  hasRemainingMessages(): boolean {
    if (this.maxMessages === -1) return true; // Unlimited
    return this.messagesUsed < this.maxMessages;
  }

  /**
   * Get remaining messages count
   * @returns Number of remaining messages (-1 for unlimited)
   */
  getRemainingMessages(): number {
    if (this.maxMessages === -1) return -1;
    return this.maxMessages - this.messagesUsed;
  }

  /**
   * Check if subscription is active and valid
   * @returns True if active
   */
  isActive(): boolean {
    const now = new Date();
    return this.status === "active" && this.endDate > now;
  }

  /**
   * Check if subscription needs renewal
   * @returns True if needs renewal
   */
  needsRenewal(): boolean {
    const now = new Date();
    return this.status === "active" && this.autoRenew && this.renewalDate <= now;
  }
}

export default Subscription;
