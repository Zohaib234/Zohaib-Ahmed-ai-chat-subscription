import bcrypt from "bcrypt";
import User from "../domains/user.js";
import UserRepository from "../repositories/user.js";
import Logger from "../utils/logger.js";
import { ConflictException } from "../utils/exception.js";

interface RegisterUserParams {
  email: string;
  password: string;
  name: string;
}

interface RegisterUserResult {
  user: User;
}

interface RegisterUserDeps {
  userRepository: UserRepository;
  logger: Logger;
}

class RegisterUserUseCase {
  private userRepository: UserRepository;
  private logger: Logger;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: RegisterUserDeps) {
    this.userRepository = deps.userRepository;
    this.logger = deps.logger.child("RegisterUserUseCase");
  }

  /**
   * Creates an instance
   * @param deps Dependencies
   * @returns RegisterUserUseCase instance
   */
  static create(deps: RegisterUserDeps): RegisterUserUseCase {
    return new RegisterUserUseCase(deps);
  }

  /**
   * Execute use case
   * @param params Register user params
   * @returns Register user result
   */
  async execute(params: RegisterUserParams): Promise<RegisterUserResult> {
    this.logger.info("Registering user", { email: params.email });

    // Check if user exists
    const existingUser = await this.userRepository.getByEmail(params.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(params.password, 10);

    // Create user entity
    const user = User.create({
      email: params.email,
      password: hashedPassword,
      name: params.name
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    this.logger.info("User registered successfully", { userId: savedUser.id });

    return { user: savedUser };
  }
}

export default RegisterUserUseCase;
