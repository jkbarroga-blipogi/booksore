import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAccessPath } from "../src/access-routes.js";

test("separates customer and admin routes by the current session role", () => {
  const paths = ["/", "/login", "/signup", "/store", "/admin/login", "/admin"];
  for (const [role, expected] of [
    [undefined, ["/login", "/login", "/signup", "/login", "/admin/login", "/admin/login"]],
    ["customer", ["/store", "/store", "/store", "/store", "/admin/login", "/admin/login"]],
    ["admin", ["/login", "/login", "/signup", "/login", "/admin", "/admin"]],
  ]) {
    assert.deepEqual(paths.map((path) => resolveAccessPath(path, role)), expected);
  }
});
