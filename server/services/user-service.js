import { ConflictError, NotFoundError } from "../errors/domain-errors.js";

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export class UserService {
  #userRepo;

  constructor(userRepo) {
    this.#userRepo = userRepo;
  }

  listUsers(query) {
    const { items, total } = this.#userRepo.findAll(query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      items: items.map(toPublicUser),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  changeRole({ userId, role, actorId }) {
    const user = this.#userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(`User ${userId} was not found`);
    }

    if (user.role === role) {
      return toPublicUser(user);
    }

    if (user.id === actorId) {
      throw new ConflictError("You cannot change your own admin access", {
        code: "SELF_ROLE_CHANGE",
      });
    }

    if (user.role === "admin" && role === "customer" && this.#userRepo.countAdmins() <= 1) {
      throw new ConflictError("The store must keep at least one administrator", {
        code: "LAST_ADMIN",
      });
    }

    const updated = this.#userRepo.updateRole(user.id, role);
    return toPublicUser(updated);
  }
}
