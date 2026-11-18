import { SESSION_COOKIE_NAME, parseCookies, verifySessionToken } from "../auth/session.js";
import { ForbiddenError, UnauthorizedError } from "../errors/domain-errors.js";

export function createAuthMiddleware(sessionSecret, userRepo) {
  function attachSession(req, _res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    const session = verifySessionToken(token, sessionSecret);

    if (!session) {
      req.user = null;
      return next();
    }

    const user = userRepo.findById(session.sub);
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    return next();
  }

  function requireAuth(req, _res, next) {
    if (!req.user) {
      return next(new UnauthorizedError("Sign-in is required to use the bookstore"));
    }
    return next();
  }

  function requireAdmin(req, _res, next) {
    if (!req.user) {
      return next(new UnauthorizedError("Admin sign-in is required"));
    }
    if (req.user.role !== "admin") {
      return next(new ForbiddenError("Admin role is required"));
    }
    return next();
  }

  return { attachSession, requireAuth, requireAdmin };
}
