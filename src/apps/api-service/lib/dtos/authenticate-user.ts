import AjvErrorResolver from "../../../packages/utils/ajv-error-resolver.js";

interface AuthenticateUserDTO {
  email: string;
  password: string;
}

interface ValidationResult {
  dto: AuthenticateUserDTO;
  errors: Array<{ field: string; message: string }>;
}

const resolver = new AjvErrorResolver();
const ajv = resolver.getAjv();

const schema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
      errorMessage: {
        type: "Email must be a string",
        format: "Email must be a valid email address"
      }
    },
    password: {
      type: "string",
      minLength: 1,
      errorMessage: {
        type: "Password must be a string",
        minLength: "Password is required"
      }
    }
  },
  required: ["email", "password"],
  additionalProperties: false,
  errorMessage: {
    required: {
      email: "Email is required",
      password: "Password is required"
    }
  }
};

const validate = ajv.compile(schema);

class AuthenticateUserDTOValidator {
  /**
   * Create and validate DTO
   * @param body Request body
   * @returns Validation result
   */
  static create(body: unknown): ValidationResult {
    const isValid = validate(body);

    if (!isValid) {
      return {
        dto: {} as AuthenticateUserDTO,
        errors: resolver.resolve(validate.errors)
      };
    }

    return {
      dto: body as AuthenticateUserDTO,
      errors: []
    };
  }
}

export default AuthenticateUserDTOValidator;
