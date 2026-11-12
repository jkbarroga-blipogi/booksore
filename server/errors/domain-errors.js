export class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_SERVER_ERROR", details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Request validation failed", details = []) {
    super(message, { statusCode: 422, code: "VALIDATION_FAILED", details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, { statusCode: 401, code: "UNAUTHORIZED" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Admin access required") {
    super(message, { statusCode: 403, code: "FORBIDDEN" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, { statusCode: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", { code = "CONFLICT", details } = {}) {
    super(message, { statusCode: 409, code, details });
  }
}
