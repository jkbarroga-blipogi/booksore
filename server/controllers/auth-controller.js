import { SESSION_COOKIE_NAME } from "../auth/session.js";
import { loginSchema } from "../validation/schemas.js";
import { ValidationError } from "../errors/domain-errors.js";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 12,
  };
}

export function createAuthController(authService) {
  return {
    async login(req, res, next) {
      try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError(
            "Invalid login payload",
            parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            })),
          );
        }
        const { token, user } = await authService.login(parsed.data);
        res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
        res.status(200).json({ data: user });
      } catch (err) {
        next(err);
      }
    },

    logout(_req, res) {
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      res.status(204).end();
    },

    me(req, res) {
      if (!req.user) {
        return res.status(200).json({ data: null });
      }
      return res.status(200).json({
        data: {
          id: req.user.sub,
          email: req.user.email,
          role: req.user.role,
        },
      });
    },
  };
}
