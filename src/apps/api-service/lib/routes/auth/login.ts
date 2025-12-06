import { Request, Response, NextFunction, Express } from "express";
import AuthenticateUserDTOValidator from "../../lib/dtos/authenticate-user.js";
import AuthenticateUserUseCase from "../../../packages/use-cases/authenticate-user.js";
import Logger from "../../../packages/utils/logger.js";

interface ServiceConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

interface LoginControllerDeps {
  app: Express;
  config: ServiceConfig;
  authenticateUserUseCase: AuthenticateUserUseCase;
  logger: Logger;
}

class LoginController {
  private app: Express;
  private config: ServiceConfig;
  private authenticateUserUseCase: AuthenticateUserUseCase;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: LoginControllerDeps) {
    if (!(deps.logger instanceof Logger)) {
      throw new TypeError("Logger must be provided");
    }

    this.app = deps.app;
    this.config = deps.config;
    this.authenticateUserUseCase = deps.authenticateUserUseCase;
    this.logger = deps.logger;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns LoginController instance
   */
  static create(server: {
    app: Express;
    config: ServiceConfig;
    userRepository: any;
    logger: Logger;
  }): LoginController {
    return new LoginController({
      app: server.app,
      config: server.config,
      authenticateUserUseCase: AuthenticateUserUseCase.create({
        userRepository: server.userRepository,
        logger: server.logger,
        jwtSecret: server.config.jwt.secret,
        jwtExpiresIn: server.config.jwt.expiresIn
      }),
      logger: server.logger
    });
  }

  /**
   * Initialize routes
   */
  initialize(): void {
    this.app.post("/v1/auth/login", this.handleLogin.bind(this));
  }

  /**
   * Handle login request
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async handleLogin(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { dto, errors } = AuthenticateUserDTOValidator.create(req.body);

      if (errors.length > 0) {
        return res.status(422).json({
          message: "Validation failed",
          errors
        });
      }

      const { token, userId } = await this.authenticateUserUseCase.execute({
        email: dto.email,
        password: dto.password
      });

      return res.status(200).json({
        message: "Login successful",
        token,
        userId
      });
    }
    catch (err) {
      next(err);
    }
  }
}

export default LoginController;
