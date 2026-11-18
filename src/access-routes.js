export function resolveAccessPath(path, role) {
  const route = path.replace(/\/+$/, "") || "/";

  if (route === "/admin" || route === "/admin/login") {
    return role === "admin" ? "/admin" : "/admin/login";
  }

  if (role === "customer") return "/store";
  return route === "/signup" ? "/signup" : "/login";
}
