import User from "../../../packages/domains/user.js";

interface MappedUser {
  id: string;
  email: string;
  name: string;
  freeMessagesUsed: number;
  freeMessagesRemaining: number;
  freeMessagesResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FREE_MESSAGES_LIMIT = 3;

class UserMapper {
  /**
   * Maps a user entity to a response object
   * @param user User entity
   * @returns Mapped user
   */
  static toResponse(user: User): MappedUser {
    return {
      id: user.id!,
      email: user.email,
      name: user.name,
      freeMessagesUsed: user.freeMessagesUsed,
      freeMessagesRemaining: Math.max(0, FREE_MESSAGES_LIMIT - user.freeMessagesUsed),
      freeMessagesResetAt: user.freeMessagesResetAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export default UserMapper;
