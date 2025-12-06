import { Request, Response, NextFunction, Express } from "express";
import RegisterUserDTOValidator from "../../lib/dtos/register-user.js";
import UserMapper from "../../lib/mappers/user.js";
import RegisterUserUseCase from "../../../packages/use-cases/register-user.js";
import Logger from "../../../packages/utils/logger.js";

interface RegisterControllerDeps {
  app: Express;
  registerUserUseCase: RegisterUserUseCase;
  logger: Logger;
}

class RegisterController {
  private app: Express;
  private registerUserUseCase: RegisterUserUseCase;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: RegisterControllerDeps) {
    if (!(deps.logger instanceof Logger)) {
      throw new TypeError("Logger must be provided");
    }

    this.app = deps.app;
    this.registerUserUseCase = deps.registerUserUseCase;
    this.logger = deps.logger;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns RegisterController instance
   */
  static create(server: {
    app: Express;
    userRepository: any;
    logger: Logger;
  }): RegisterController {
    return new RegisterController({
      app: server.app,
      registerUserUseCase: RegisterUserUseCase.create({
        userRepository: server.userRepository,
        logger: server.logger
      }),
      logger: server.logger
    });
  }

  /**
   * Initialize routes
   */
  initialize(): void {
    this.app.post("/v1/auth/register", this.handleRegister.bind(this));
  }

  /**
   * Handle register request
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async handleRegister(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { dto, errors } = RegisterUserDTOValidator.create(req.body);

      if (errors.length > 0) {
        return res.status(422).json({
          message: "Validation failed",
          errors
        });
      }

      const { user } = await this.registerUserUseCase.execute({
        email: dto.email,
        password: dto.password,
        name: dto.name
      });

      const mappedUser = UserMapper.toResponse(user);

      return res.status(201).json({
        message: "User registered successfully",
        user: mappedUser
      });
    }
    catch (err) {
      next(err);
    }
  }
}

export default RegisterController;
