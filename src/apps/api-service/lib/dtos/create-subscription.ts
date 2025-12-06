import AjvErrorResolver from "../../../packages/utils/ajv-error-resolver.js";

interface CreateSubscriptionDTO {
  tier: "basic" | "pro" | "enterprise";
  billingCycle: "monthly" | "yearly";
  autoRenew?: boolean;
}

interface ValidationResult {
  dto: CreateSubscriptionDTO;
  errors: Array<{ field: string; message: string }>;
}

const resolver = new AjvErrorResolver();
const ajv = resolver.getAjv();

const schema = {
  type: "object",
  properties: {
    tier: {
      type: "string",
      enum: ["basic", "pro", "enterprise"],
      errorMessage: {
        type: "Tier must be a string",
        enum: "Tier must be one of: basic, pro, enterprise"
      }
    },
    billingCycle: {
      type: "string",
      enum: ["monthly", "yearly"],
      errorMessage: {
        type: "Billing cycle must be a string",
        enum: "Billing cycle must be one of: monthly, yearly"
      }
    },
    autoRenew: {
      type: "boolean",
      errorMessage: {
        type: "Auto renew must be a boolean"
      }
    }
  },
  required: ["tier", "billingCycle"],
  additionalProperties: false,
  errorMessage: {
    required: {
      tier: "Tier is required",
      billingCycle: "Billing cycle is required"
    }
  }
};

const validate = ajv.compile(schema);

class CreateSubscriptionDTOValidator {
  /**
   * Create and validate DTO
   * @param body Request body
   * @returns Validation result
   */
  static create(body: unknown): ValidationResult {
    const isValid = validate(body);

    if (!isValid) {
      return {
        dto: {} as CreateSubscriptionDTO,
        errors: resolver.resolve(validate.errors)
      };
    }

    return {
      dto: body as CreateSubscriptionDTO,
      errors: []
    };
  }
}

export default CreateSubscriptionDTOValidator;
