import AjvErrorResolver from "../../../packages/utils/ajv-error-resolver.js";

interface RegisterUserDTO {
  email: string;
  password: string;
  name: string;
}

interface ValidationResult {
  dto: RegisterUserDTO;
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
      minLength: 8,
      errorMessage: {
        type: "Password must be a string",
        minLength: "Password must be at least 8 characters"
      }
    },
    name: {
      type: "string",
      minLength: 1,
      maxLength: 255,
      errorMessage: {
        type: "Name must be a string",
        minLength: "Name is required",
        maxLength: "Name must be less than 255 characters"
      }
    }
  },
  required: ["email", "password", "name"],
  additionalProperties: false,
  errorMessage: {
    required: {
      email: "Email is required",
      password: "Password is required",
      name: "Name is required"
    }
  }
};

const validate = ajv.compile(schema);

class RegisterUserDTOValidator {
  /**
   * Create and validate DTO
   * @param body Request body
   * @returns Validation result
   */
  static create(body: unknown): ValidationResult {
    const isValid = validate(body);

    if (!isValid) {
      return {
        dto: {} as RegisterUserDTO,
        errors: resolver.resolve(validate.errors)
      };
    }

    return {
      dto: body as RegisterUserDTO,
      errors: []
    };
  }
}

export default RegisterUserDTOValidator;
