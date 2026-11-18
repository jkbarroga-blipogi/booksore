import { hashPassword, verifyPassword } from "../auth/password.js";
import { createSessionToken } from "../auth/session.js";
import { ConflictError, ForbiddenError, UnauthorizedError } from "../errors/domain-errors.js";

export class AuthService {
  #userRepo;
  #sessionSecret;

  constructor(userRepo, sessionSecret) {
    this.#userRepo = userRepo;
    this.#sessionSecret = sessionSecret;
  }

  async register({ username, password }) {
    const existing = this.#userRepo.findByUsername(username);
    if (existing) {
      throw new ConflictError(`Username "${username}" is already taken`, {
        code: "USERNAME_TAKEN",
      });
    }

    const passwordHash = await hashPassword(password);
    const user = this.#userRepo.createCustomer({ username, passwordHash });
    const token = createSessionToken(user, this.#sessionSecret);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login({ username, email, password }, requiredRole) {
    const identifier = username || email;
    const user = this.#userRepo.findByUsernameOrEmail(identifier);
    if (!user) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid username or password");
    }

    if (user.role !== requiredRole) {
      throw new ForbiddenError(
        requiredRole === "admin"
          ? "This sign-in is for admin accounts only."
          : "This sign-in is for customer accounts only.",
      );
    }

    const token = createSessionToken(user, this.#sessionSecret);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
