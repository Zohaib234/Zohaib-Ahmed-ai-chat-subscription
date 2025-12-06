import Subscription from "../../../packages/domains/subscription.js";

interface MappedSubscription {
  id: string;
  userId: string;
  tier: string;
  billingCycle: string;
  maxMessages: number;
  messagesUsed: number;
  messagesRemaining: number | "unlimited";
  price: number;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

class SubscriptionMapper {
  /**
   * Maps a subscription entity to a response object
   * @param subscription Subscription entity
   * @returns Mapped subscription
   */
  static toResponse(subscription: Subscription): MappedSubscription {
    const messagesRemaining = subscription.maxMessages === -1
      ? "unlimited"
      : subscription.maxMessages - subscription.messagesUsed;

    return {
      id: subscription.id!,
      userId: subscription.userId,
      tier: subscription.tier,
      billingCycle: subscription.billingCycle,
      maxMessages: subscription.maxMessages,
      messagesUsed: subscription.messagesUsed,
      messagesRemaining,
      price: subscription.price,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      renewalDate: subscription.renewalDate,
      autoRenew: subscription.autoRenew,
      status: subscription.status,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };
  }

  /**
   * Maps multiple subscription entities to response objects
   * @param subscriptions Array of subscription entities
   * @returns Array of mapped subscriptions
   */
  static toResponseArray(subscriptions: Subscription[]): MappedSubscription[] {
    return subscriptions.map((subscription) => this.toResponse(subscription));
  }
}

export default SubscriptionMapper;
