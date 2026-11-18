export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code || "REQUEST_FAILED";
    this.details = details || [];
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", {
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const err = payload?.error;
    const fallbackMessage =
      response.status >= 500
        ? "The server is unavailable right now. Try again in a moment."
        : "Request failed";
    throw new ApiError(err?.message || fallbackMessage, {
      status: response.status,
      code: err?.code,
      details: err?.details,
    });
  }

  return payload;
}

export const api = {
  getSession() {
    return request("/api/v1/auth/me");
  },

  register(credentials) {
    return request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  login(credentials) {
    return request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  loginAdmin(credentials) {
    return request("/api/v1/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  logout() {
    return request("/api/v1/auth/logout", {
      method: "POST",
    });
  },

  getMyOrders() {
    return request("/api/v1/orders/my-orders");
  },

  listUsers(params = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "" && value !== null) {
        search.set(key, String(value));
      }
    }
    const qs = search.toString();
    return request(`/api/v1/users${qs ? `?${qs}` : ""}`);
  },

  updateUserRole(id, role) {
    return request(`/api/v1/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  listBooks(params = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "" && value !== null) {
        search.set(key, String(value));
      }
    }
    const qs = search.toString();
    return request(`/api/v1/books${qs ? `?${qs}` : ""}`);
  },

  createBook(book) {
    return request("/api/v1/books", {
      method: "POST",
      body: JSON.stringify(book),
    });
  },

  updateBook(id, updates) {
    return request(`/api/v1/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteBook(id) {
    return request(`/api/v1/books/${id}`, {
      method: "DELETE",
    });
  },

  checkout(items) {
    return request("/api/v1/checkout", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },
};
