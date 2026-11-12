import { SESSION_COOKIE_NAME, parseCookies, verifySessionToken } from "../auth/session.js";
import { ForbiddenError, UnauthorizedError } from "../errors/domain-errors.js";

export function createAuthMiddleware(sessionSecret) {
  function attachSession(req, _res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    req.user = verifySessionToken(token, sessionSecret);
    next();
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

  return { attachSession, requireAdmin };
}
