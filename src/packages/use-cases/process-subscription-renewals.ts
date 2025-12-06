import Subscription from "../domains/subscription.js";
import SubscriptionRepository from "../repositories/subscription.js";
import Logger from "../utils/logger.js";

interface ProcessRenewalsResult {
  renewed: Subscription[];
  failed: string[];
}

interface ProcessRenewalsDeps {
  subscriptionRepository: SubscriptionRepository;
  logger: Logger;
}

class ProcessSubscriptionRenewalsUseCase {
  private subscriptionRepository: SubscriptionRepository;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: ProcessRenewalsDeps) {
    this.subscriptionRepository = deps.subscriptionRepository;
    this.logger = deps.logger.child("ProcessSubscriptionRenewalsUseCase");
  }

  /**
   * Creates an instance
   * @param deps Dependencies
   * @returns ProcessSubscriptionRenewalsUseCase instance
   */
  static create(deps: ProcessRenewalsDeps): ProcessSubscriptionRenewalsUseCase {
    return new ProcessSubscriptionRenewalsUseCase(deps);
  }

  /**
   * Simulate payment processing (randomly fails 20% of the time)
   * @returns True if payment succeeded
   */
  private simulatePayment(): boolean {
    const success = Math.random() > 0.2; // 80% success rate
    return success;
  }

  /**
   * Execute use case - process all subscriptions due for renewal
   * @returns Process renewals result
   */
  async execute(): Promise<ProcessRenewalsResult> {
    this.logger.info("Processing subscription renewals");

    const subscriptionsDue = await this.subscriptionRepository.getSubscriptionsDueForRenewal();
    const renewed: Subscription[] = [];
    const failed: string[] = [];

    for (const subscription of subscriptionsDue) {
      try {
        // Simulate payment
        const paymentSucceeded = this.simulatePayment();

        if (paymentSucceeded) {
          // Renew subscription
          const renewedSubscription = await this.subscriptionRepository.renewSubscription(subscription.id!);
          if (renewedSubscription) {
            renewed.push(renewedSubscription);
            this.logger.info("Subscription renewed", {
              subscriptionId: subscription.id,
              newEndDate: renewedSubscription.endDate
            });
          }
        }
        else {
          // Mark as inactive due to payment failure
          await this.subscriptionRepository.updateStatus(subscription.id!, "inactive");
          failed.push(subscription.id!);
          this.logger.warn("Subscription renewal failed - payment declined", {
            subscriptionId: subscription.id
          });
        }
      }
      catch (error) {
        failed.push(subscription.id!);
        this.logger.error("Error processing subscription renewal", {
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    this.logger.info("Subscription renewals processed", {
      total: subscriptionsDue.length,
      renewed: renewed.length,
      failed: failed.length
    });

    return { renewed, failed };
  }
}

export default ProcessSubscriptionRenewalsUseCase;
