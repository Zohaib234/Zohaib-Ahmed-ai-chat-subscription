import AjvErrorResolver from "../../../packages/utils/ajv-error-resolver.js";

interface SendMessageDTO {
  question: string;
}

interface ValidationResult {
  dto: SendMessageDTO;
  errors: Array<{ field: string; message: string }>;
}

const resolver = new AjvErrorResolver();
const ajv = resolver.getAjv();

const schema = {
  type: "object",
  properties: {
    question: {
      type: "string",
      minLength: 1,
      maxLength: 10000,
      errorMessage: {
        type: "Question must be a string",
        minLength: "Question is required",
        maxLength: "Question must be less than 10000 characters"
      }
    }
  },
  required: ["question"],
  additionalProperties: false,
  errorMessage: {
    required: {
      question: "Question is required"
    }
  }
};

const validate = ajv.compile(schema);

class SendMessageDTOValidator {
  /**
   * Create and validate DTO
   * @param body Request body
   * @returns Validation result
   */
  static create(body: unknown): ValidationResult {
    const isValid = validate(body);

    if (!isValid) {
      return {
        dto: {} as SendMessageDTO,
        errors: resolver.resolve(validate.errors)
      };
    }

    return {
      dto: body as SendMessageDTO,
      errors: []
    };
  }
}

export default SendMessageDTOValidator;
