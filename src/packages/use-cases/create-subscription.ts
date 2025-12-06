import Subscription, { SubscriptionTier, BillingCycle } from "../domains/subscription.js";
import SubscriptionRepository from "../repositories/subscription.js";
import UserRepository from "../repositories/user.js";
import Logger from "../utils/logger.js";
import { NotFoundException } from "../utils/exception.js";

interface CreateSubscriptionParams {
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  autoRenew?: boolean;
}

interface CreateSubscriptionResult {
  subscription: Subscription;
}

interface CreateSubscriptionDeps {
  subscriptionRepository: SubscriptionRepository;
  userRepository: UserRepository;
  logger: Logger;
}

class CreateSubscriptionUseCase {
  private subscriptionRepository: SubscriptionRepository;
  private userRepository: UserRepository;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: CreateSubscriptionDeps) {
    this.subscriptionRepository = deps.subscriptionRepository;
    this.userRepository = deps.userRepository;
    this.logger = deps.logger.child("CreateSubscriptionUseCase");
  }

  /**
   * Creates an instance
   * @param deps Dependencies
   * @returns CreateSubscriptionUseCase instance
   */
  static create(deps: CreateSubscriptionDeps): CreateSubscriptionUseCase {
    return new CreateSubscriptionUseCase(deps);
  }

  /**
   * Execute use case
   * @param params Create subscription params
   * @returns Create subscription result
   */
  async execute(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    this.logger.info("Creating subscription", {
      userId: params.userId,
      tier: params.tier,
      billingCycle: params.billingCycle
    });

    // Verify user exists
    const user = await this.userRepository.getById(params.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Create subscription entity
    const subscription = Subscription.create({
      userId: params.userId,
      tier: params.tier,
      billingCycle: params.billingCycle,
      autoRenew: params.autoRenew
    });

    // Save subscription
    const savedSubscription = await this.subscriptionRepository.save(subscription);

    this.logger.info("Subscription created successfully", {
      subscriptionId: savedSubscription.id,
      tier: savedSubscription.tier,
      price: savedSubscription.price
    });

    return { subscription: savedSubscription };
  }
}

export default CreateSubscriptionUseCase;
