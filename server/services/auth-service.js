import { verifyPassword } from "../auth/password.js";
import { createSessionToken } from "../auth/session.js";
import { UnauthorizedError } from "../errors/domain-errors.js";

export class AuthService {
  #userRepo;
  #sessionSecret;

  constructor(userRepo, sessionSecret) {
    this.#userRepo = userRepo;
    this.#sessionSecret = sessionSecret;
  }

  async login({ email, password }) {
    const user = this.#userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = createSessionToken(user, this.#sessionSecret);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
