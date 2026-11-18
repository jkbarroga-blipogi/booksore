import {
  updateUserRoleSchema,
  userIdParamSchema,
  userListQuerySchema,
} from "../validation/schemas.js";
import { ValidationError } from "../errors/domain-errors.js";

function parseWithSchema(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    throw new ValidationError("Request payload validation failed", details);
  }
  return result.data;
}

export function createUserController(userService) {
  return {
    list(req, res) {
      const query = parseWithSchema(userListQuerySchema, req.query);
      const { items, meta } = userService.listUsers(query);
      res.status(200).json({ data: items, meta });
    },

    updateRole(req, res) {
      const { id } = parseWithSchema(userIdParamSchema, req.params);
      const { role } = parseWithSchema(updateUserRoleSchema, req.body);
      const user = userService.changeRole({
        userId: id,
        role,
        actorId: req.user.sub,
      });
      res.status(200).json({ data: user });
    },
  };
}
