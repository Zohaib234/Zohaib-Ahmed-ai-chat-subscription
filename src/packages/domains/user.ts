/**
 * User domain entity properties
 */
export interface UserProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  freeMessagesUsed: number;
  freeMessagesResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User create properties
 */
export interface UserCreateProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  freeMessagesUsed?: number;
  freeMessagesResetAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User database object
 */
export interface UserDO {
  id: string;
  email: string;
  password: string;
  name: string;
  free_messages_used: number;
  free_messages_reset_at: Date;
  created_at: Date;
  updated_at: Date;
}

class User {
  public readonly id?: string;
  public readonly email: string;
  public readonly password: string;
  public readonly name: string;
  public readonly freeMessagesUsed: number;
  public readonly freeMessagesResetAt: Date;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  /**
   * Constructor
   * @param props User properties
   */
  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.freeMessagesUsed = props.freeMessagesUsed;
    this.freeMessagesResetAt = props.freeMessagesResetAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new user
   * @param props User create properties
   * @returns User entity
   */
  static create(props: UserCreateProps): User {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return new User({
      id: props.id,
      email: props.email,
      password: props.password,
      name: props.name,
      freeMessagesUsed: props.freeMessagesUsed ?? 0,
      freeMessagesResetAt: props.freeMessagesResetAt ?? firstOfMonth,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now
    });
  }

  /**
   * Creates user entity from database object
   * @param DO Database object
   * @returns User entity
   */
  static fromDO(DO: UserDO): User {
    return User.create({
      id: DO.id,
      email: DO.email,
      password: DO.password,
      name: DO.name,
      freeMessagesUsed: DO.free_messages_used,
      freeMessagesResetAt: DO.free_messages_reset_at,
      createdAt: DO.created_at,
      updatedAt: DO.updated_at
    });
  }

  /**
   * Creates database object from user entity
   * @param entity User entity
   * @returns Database object
   */
  static toDO(entity: User): Omit<UserDO, "id"> {
    return {
      email: entity.email,
      password: entity.password,
      name: entity.name,
      free_messages_used: entity.freeMessagesUsed,
      free_messages_reset_at: entity.freeMessagesResetAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Check if free messages need to be reset
   * @returns True if reset is needed
   */
  shouldResetFreeMessages(): boolean {
    const now = new Date();
    const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.freeMessagesResetAt < firstOfCurrentMonth;
  }

  /**
   * Check if user has free messages remaining
   * @returns True if has free messages
   */
  hasFreeMessages(): boolean {
    const FREE_MESSAGES_LIMIT = 3;
    return this.freeMessagesUsed < FREE_MESSAGES_LIMIT;
  }
}

export default User;
