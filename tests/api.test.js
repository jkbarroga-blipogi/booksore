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
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
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

  it("allows public read and rejects unauthenticated admin mutations", async () => {
    const health = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(health.status, 200);

    const listRes = await fetch(`${baseUrl}/api/v1/books`);
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(listBody.data.length >= 1);

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
  });

  it("allows authenticated admin CRUD and blocks bad credentials", async () => {
    const badLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
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

  it("handles checkout atomically and returns 409 for out-of-stock items", async () => {
    const listBody = await (await fetch(`${baseUrl}/api/v1/books?limit=50`)).json();
    const outOfStock = listBody.data.find((b) => b.stock === 0);
    const inStock = listBody.data.find((b) => b.stock >= 2);

    assert.ok(outOfStock);
    assert.ok(inStock);

    const failCheckout = await fetch(`${baseUrl}/api/v1/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ bookId: inStock.id, quantity: 2 }],
      }),
    });
    assert.equal(okCheckout.status, 200);
    const okBody = await okCheckout.json();
    assert.equal(okBody.data.totalCents, inStock.priceCents * 2);

    const updatedBook = await (await fetch(`${baseUrl}/api/v1/books/${inStock.id}`)).json();
    assert.equal(updatedBook.data.stock, inStock.stock - 2);
  });
});
