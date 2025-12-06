import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/user.js";
import Logger from "../utils/logger.js";
import { UnauthorizedException } from "../utils/exception.js";

interface AuthenticateUserParams {
  email: string;
  password: string;
}

interface AuthenticateUserResult {
  token: string;
  userId: string;
}

interface AuthenticateUserDeps {
  userRepository: UserRepository;
  logger: Logger;
  jwtSecret: string;
  jwtExpiresIn: string;
}

class AuthenticateUserUseCase {
  private userRepository: UserRepository;
  private logger: Logger;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: AuthenticateUserDeps) {
    this.userRepository = deps.userRepository;
    this.logger = deps.logger.child("AuthenticateUserUseCase");
    this.jwtSecret = deps.jwtSecret;
    this.jwtExpiresIn = deps.jwtExpiresIn;
  }

  /**
   * Creates an instance
   * @param deps Dependencies
   * @returns AuthenticateUserUseCase instance
   */
  static create(deps: AuthenticateUserDeps): AuthenticateUserUseCase {
    return new AuthenticateUserUseCase(deps);
  }

  /**
   * Execute use case
   * @param params Authenticate user params
   * @returns Authenticate user result
   */
  async execute(params: AuthenticateUserParams): Promise<AuthenticateUserResult> {
    this.logger.info("Authenticating user", { email: params.email });

    // Get user by email
    const user = await this.userRepository.getByEmail(params.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(params.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    this.logger.info("User authenticated successfully", { userId: user.id });

    return { token, userId: user.id! };
  }
}

export default AuthenticateUserUseCase;
