import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { APIException, BadRequestException, UnauthorizedException } from "../../../packages/utils/exception.js";

interface ServiceConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

/**
 * Protect route middleware
 */
export default function protectRoute(this: { config: ServiceConfig }) {
  const appConfig = this.config;

  return (req: Request & { userId?: string }, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedException("Authorization token missing or malformed");
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, appConfig.jwt.secret) as { userId: string };

      if (typeof decoded === "string" || !decoded.userId) {
        throw new BadRequestException("Invalid token payload");
      }

      req.userId = decoded.userId;

      next();
    }
    catch (err) {
      if (err instanceof APIException) {
        return next(err);
      }

      const translatedError = new BadRequestException("Invalid or expired token");
      translatedError.cause = err instanceof Error ? err : undefined;

      next(translatedError);
    }
  };
}
