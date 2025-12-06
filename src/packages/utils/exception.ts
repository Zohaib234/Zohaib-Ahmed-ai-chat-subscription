/**
 * Base API exception
 */
export class APIException extends Error {
  public statusCode: number;
  public cause?: Error;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "APIException";
    this.statusCode = statusCode;
  }
}

/**
 * Bad request exception (400)
 */
export class BadRequestException extends APIException {
  constructor(message: string) {
    super(message, 400);
    this.name = "BadRequestException";
  }
}

/**
 * Unauthorized exception (401)
 */
export class UnauthorizedException extends APIException {
  constructor(message: string) {
    super(message, 401);
    this.name = "UnauthorizedException";
  }
}

/**
 * Forbidden exception (403)
 */
export class ForbiddenException extends APIException {
  constructor(message: string) {
    super(message, 403);
    this.name = "ForbiddenException";
  }
}

/**
 * Not found exception (404)
 */
export class NotFoundException extends APIException {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundException";
  }
}

/**
 * Conflict exception (409)
 */
export class ConflictException extends APIException {
  constructor(message: string) {
    super(message, 409);
    this.name = "ConflictException";
  }
}

/**
 * Quota exceeded exception (429)
 */
export class QuotaExceededException extends APIException {
  public remainingFreeMessages: number;
  public hasActiveSubscription: boolean;

  constructor(message: string, remainingFreeMessages: number, hasActiveSubscription: boolean) {
    super(message, 429);
    this.name = "QuotaExceededException";
    this.remainingFreeMessages = remainingFreeMessages;
    this.hasActiveSubscription = hasActiveSubscription;
  }
}

/**
 * Internal server error exception (500)
 */
export class InternalServerException extends APIException {
  constructor(message: string) {
    super(message, 500);
    this.name = "InternalServerException";
  }
}
