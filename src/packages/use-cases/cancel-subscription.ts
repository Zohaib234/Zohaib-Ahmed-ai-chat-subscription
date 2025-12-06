import Subscription from "../domains/subscription.js";
import SubscriptionRepository from "../repositories/subscription.js";
import Logger from "../utils/logger.js";
import { ForbiddenException, NotFoundException } from "../utils/exception.js";

interface CancelSubscriptionParams {
  subscriptionId: string;
  userId: string;
}

interface CancelSubscriptionResult {
  subscription: Subscription;
}

interface CancelSubscriptionDeps {
  subscriptionRepository: SubscriptionRepository;
  logger: Logger;
}

class CancelSubscriptionUseCase {
  private subscriptionRepository: SubscriptionRepository;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: CancelSubscriptionDeps) {
    this.subscriptionRepository = deps.subscriptionRepository;
    this.logger = deps.logger.child("CancelSubscriptionUseCase");
  }

  /**
   * Creates an instance
   * @param deps Dependencies
   * @returns CancelSubscriptionUseCase instance
   */
  static create(deps: CancelSubscriptionDeps): CancelSubscriptionUseCase {
    return new CancelSubscriptionUseCase(deps);
  }

  /**
   * Execute use case
   * @param params Cancel subscription params
   * @returns Cancel subscription result
   */
  async execute(params: CancelSubscriptionParams): Promise<CancelSubscriptionResult> {
    this.logger.info("Cancelling subscription", { subscriptionId: params.subscriptionId });

    // Get subscription
    const subscription = await this.subscriptionRepository.getById(params.subscriptionId);
    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    // Verify ownership
    if (subscription.userId !== params.userId) {
      throw new ForbiddenException("You do not own this subscription");
    }

    // Cancel subscription (ends current billing cycle, prevents renewal)
    const cancelledSubscription = await this.subscriptionRepository.cancelSubscription(params.subscriptionId);
    if (!cancelledSubscription) {
      throw new NotFoundException("Subscription not found after cancellation");
    }

    this.logger.info("Subscription cancelled successfully", {
      subscriptionId: params.subscriptionId,
      endDate: cancelledSubscription.endDate
    });

    return { subscription: cancelledSubscription };
  }
}

export default CancelSubscriptionUseCase;
