import Ajv from "ajv";
import addErrors from "ajv-errors";
import addFormats from "ajv-formats";

interface ResolvedError {
  field: string;
  message: string;
}

/**
 * AJV error resolver
 */
class AjvErrorResolver {
  private ajv: Ajv;

  /**
   * Constructor
   */
  constructor() {
    const AjvConstructor = Ajv.default;
    this.ajv = new AjvConstructor({ allErrors: true });
    addFormats.default(this.ajv);
    addErrors.default(this.ajv);
  }

  /**
   * Get AJV instance
   * @returns AJV instance
   */
  getAjv(): Ajv {
    return this.ajv;
  }

  /**
   * Resolve AJV errors to structured format
   * @param errors AJV errors
   * @returns Resolved errors
   */
  resolve(errors: Ajv["errors"]): ResolvedError[] {
    if (!errors) return [];

    return errors.map((error) => {
      const field = error.instancePath
        ? error.instancePath.replace(/^\//, "").replace(/\//g, ".")
        : error.params?.missingProperty || "unknown";

      return {
        field: String(field),
        message: error.message || "Invalid value"
      };
    });
  }
}

export default AjvErrorResolver;
