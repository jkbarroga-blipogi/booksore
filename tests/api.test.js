import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createDatabase } from "../server/db/database.js";
import { createApp } from "../server/app.js";
import { seedDatabase } from "../server/services/seed-service.js";

describe("Booksore API", () => {
  let db;
  let server;
  let baseUrl;
  const adminCreds = {
    email: "admin@booksore.test",
    password: "test-admin-password-123",
  };

  beforeEach(async () => {
    db = createDatabase(":memory:");
    await seedDatabase(db, {
      adminEmail: adminCreds.email,
      adminPassword: adminCreds.password,
    });
    const app = createApp({
      db,
      sessionSecret: "test-session-secret-0123456789abcdef",
      silentLogs: true,
    });
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });

  async function loginAsAdmin() {
    const res = await fetch(`${baseUrl}/api/v1/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminCreds),
    });
    assert.equal(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    return setCookie.split(";")[0];
  }

  async function registerCustomer(username = "maria_clara") {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: "securepassword123" }),
    });
    assert.equal(res.status, 201);
    const cookie = res.headers.get("set-cookie").split(";")[0];
    const body = await res.json();
    return { cookie, user: body.data };
  }

  it("locks the catalog behind sign-in and rejects unauthenticated admin mutations", async () => {
    const health = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(health.status, 200);

    const listRes = await fetch(`${baseUrl}/api/v1/books`);
    assert.equal(listRes.status, 401);
    assert.equal((await listRes.json()).error.code, "UNAUTHORIZED");

    const checkoutRes = await fetch(`${baseUrl}/api/v1/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(checkoutRes.status, 401);

    const createRes = await fetch(`${baseUrl}/api/v1/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Unauthorized Book",
        author: "Nobody",
        isbn: "9780132350884",
        genre: "Fiction",
        priceCents: 1500,
        stock: 3,
        publishedYear: 2020,
      }),
    });
    assert.equal(createRes.status, 401);

    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(meRes.status, 200);
    assert.equal((await meRes.json()).data, null);
  });

  it("allows authenticated admin CRUD and blocks bad credentials", async () => {
    const badLogin = await fetch(`${baseUrl}/api/v1/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminCreds.email, password: "wrong" }),
    });
    assert.equal(badLogin.status, 401);

    const cookie = await loginAsAdmin();

    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.data.email, adminCreds.email);

    const listRes = await fetch(`${baseUrl}/api/v1/books`, {
      headers: { Cookie: cookie },
    });
    assert.equal(listRes.status, 200);
    assert.ok((await listRes.json()).data.length >= 1);

    const createRes = await fetch(`${baseUrl}/api/v1/books`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        title: "A Pattern Language",
        author: "Christopher Alexander",
        isbn: "978-0-19-501919-3",
        genre: "Architecture",
        priceCents: 6500,
        stock: 4,
        publishedYear: 1977,
        description: "Towns, buildings, and construction patterns.",
        featured: true,
      }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()).data;

    const patchRes = await fetch(`${baseUrl}/api/v1/books/${created.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ stock: 9 }),
    });
    assert.equal(patchRes.status, 200);
    assert.equal((await patchRes.json()).data.stock, 9);

    const delRes = await fetch(`${baseUrl}/api/v1/books/${created.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    assert.equal(delRes.status, 204);
  });

  it("accepts credentials only at the sign-in for the account's role", async () => {
    const username = "customer_reader";
    await registerCustomer(username);
    const customerCreds = { username, password: "securepassword123" };
    const login = (path, credentials) =>
      fetch(`${baseUrl}/api/v1/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

    for (const [path, credentials] of [
      ["login", adminCreds],
      ["admin/login", customerCreds],
    ]) {
      const response = await login(path, credentials);
      assert.equal(response.status, 403);
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal((await response.json()).error.code, "FORBIDDEN");
    }

    const readerLogin = await login("login", customerCreds);
    assert.equal(readerLogin.status, 200);
    assert.ok(readerLogin.headers.get("set-cookie"));
    assert.equal((await readerLogin.json()).data.role, "customer");

    await loginAsAdmin();
  });

  it("handles checkout atomically and returns 409 for out-of-stock items", async () => {
    const { cookie } = await registerCustomer("checkout_reader");
    const listBody = await (
      await fetch(`${baseUrl}/api/v1/books?limit=50`, { headers: { Cookie: cookie } })
    ).json();
    const outOfStock = listBody.data.find((b) => b.stock === 0);
    const inStock = listBody.data.find((b) => b.stock >= 2);

    assert.ok(outOfStock);
    assert.ok(inStock);

    const failCheckout = await fetch(`${baseUrl}/api/v1/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        items: [
          { bookId: inStock.id, quantity: 1 },
          { bookId: outOfStock.id, quantity: 1 },
        ],
      }),
    });
    assert.equal(failCheckout.status, 409);
    const failBody = await failCheckout.json();
    assert.equal(failBody.error.code, "OUT_OF_STOCK");

    const okCheckout = await fetch(`${baseUrl}/api/v1/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        items: [{ bookId: inStock.id, quantity: 2 }],
      }),
    });
    assert.equal(okCheckout.status, 200);
    const okBody = await okCheckout.json();
    assert.equal(okBody.data.totalCents, inStock.priceCents * 2);

    const updatedBook = await (
      await fetch(`${baseUrl}/api/v1/books/${inStock.id}`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(updatedBook.data.stock, inStock.stock - 2);
  });

  it("registers customer with username, logs in, checks out, and fetches my-orders", async () => {
    const { cookie: regCookie, user } = await registerCustomer();
    assert.equal(user.username, "maria_clara");
    assert.equal(user.role, "customer");

    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: regCookie },
    });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.data.username, "maria_clara");
    assert.equal(meBody.data.role, "customer");

    const booksRes = await fetch(`${baseUrl}/api/v1/books`, {
      headers: { Cookie: regCookie },
    });
    assert.equal(booksRes.status, 200);
    const book = (await booksRes.json()).data.find((b) => b.stock > 0);

    const checkoutRes = await fetch(`${baseUrl}/api/v1/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: regCookie,
      },
      body: JSON.stringify({
        items: [{ bookId: book.id, quantity: 1 }],
      }),
    });
    assert.equal(checkoutRes.status, 200);

    const ordersRes = await fetch(`${baseUrl}/api/v1/orders/my-orders`, {
      headers: { Cookie: regCookie },
    });
    assert.equal(ordersRes.status, 200);
    const ordersBody = await ordersRes.json();
    assert.equal(ordersBody.data.length, 1);
    assert.equal(ordersBody.data[0].items[0].bookId, book.id);
  });

  it("limits member management to admins and applies role changes to live sessions", async () => {
    const { cookie: customerCookie, user: customer } = await registerCustomer("role_reader");

    const forbiddenList = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Cookie: customerCookie },
    });
    assert.equal(forbiddenList.status, 403);

    const forbiddenPatch = await fetch(`${baseUrl}/api/v1/users/${customer.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: customerCookie },
      body: JSON.stringify({ role: "admin" }),
    });
    assert.equal(forbiddenPatch.status, 403);

    const adminCookie = await loginAsAdmin();
    const listRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(listBody.data.length >= 2);
    assert.ok(listBody.data.every((user) => user.passwordHash === undefined));
    const adminUser = listBody.data.find((user) => user.email === adminCreds.email);
    assert.ok(adminUser);

    const promoteRes = await fetch(`${baseUrl}/api/v1/users/${customer.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ role: "admin" }),
    });
    assert.equal(promoteRes.status, 200);
    assert.equal((await promoteRes.json()).data.role, "admin");

    const promotedMe = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: customerCookie },
    });
    assert.equal((await promotedMe.json()).data.role, "admin");

    const demoteRes = await fetch(`${baseUrl}/api/v1/users/${customer.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ role: "customer" }),
    });
    assert.equal(demoteRes.status, 200);
    assert.equal((await demoteRes.json()).data.role, "customer");

    const demotedMe = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: customerCookie },
    });
    assert.equal((await demotedMe.json()).data.role, "customer");

    const selfDemote = await fetch(`${baseUrl}/api/v1/users/${adminUser.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ role: "customer" }),
    });
    assert.equal(selfDemote.status, 409);
    assert.equal((await selfDemote.json()).error.code, "SELF_ROLE_CHANGE");

    const invalidRole = await fetch(`${baseUrl}/api/v1/users/${customer.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ role: "owner" }),
    });
    assert.equal(invalidRole.status, 422);

    const missingUser = await fetch(
      `${baseUrl}/api/v1/users/550e8400-e29b-41d4-a716-446655440000/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ role: "admin" }),
      },
    );
    assert.equal(missingUser.status, 404);
  });
});
