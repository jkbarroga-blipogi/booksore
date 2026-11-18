import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createBookSchema,
  updateBookSchema,
  bookQuerySchema,
  idParamSchema,
  loginSchema,
  registerSchema,
  checkoutSchema,
  updateUserRoleSchema,
  userListQuerySchema,
} from "../server/validation/schemas.js";

describe("validation schemas", () => {
  it("validates and normalizes createBookSchema with coverUrl and featured", () => {
    const parsed = createBookSchema.safeParse({
      title: "  Piranesi  ",
      author: "Susanna Clarke",
      isbn: "978-1-63557-563-7",
      genre: "Literary Fiction",
      priceCents: 2100,
      stock: 6,
      publishedYear: 2020,
      description: "A labyrinthine house of infinite halls.",
      coverUrl: "https://example.com/piranesi.jpg",
      featured: true,
    });

    assert.equal(parsed.success, true);
    assert.equal(parsed.data.title, "Piranesi");
    assert.equal(parsed.data.isbn, "9781635575637");
    assert.equal(parsed.data.featured, true);
    assert.equal(parsed.data.coverUrl, "https://example.com/piranesi.jpg");
  });

  it("rejects unsafe coverUrl schemes such as javascript:", () => {
    const parsed = createBookSchema.safeParse({
      title: "Unsafe",
      author: "Tester",
      isbn: "9780132350884",
      genre: "Fiction",
      priceCents: 1000,
      stock: 1,
      publishedYear: 2020,
      coverUrl: "javascript:alert(1)",
    });

    assert.equal(parsed.success, false);
  });

  it("requires non-empty updateBookSchema and valid UUID idParamSchema", () => {
    assert.equal(updateBookSchema.safeParse({}).success, false);
    assert.equal(updateBookSchema.safeParse({ featured: false }).success, true);
    assert.equal(idParamSchema.safeParse({ id: "not-a-uuid" }).success, false);
    assert.equal(
      idParamSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success,
      true,
    );
  });

  it("validates bookQuerySchema filters and rejects invalid sort keys", () => {
    const valid = bookQuerySchema.safeParse({
      featured: "true",
      inStock: "true",
      page: "2",
      limit: "24",
    });
    assert.equal(valid.success, true);
    assert.equal(valid.data.featured, true);
    assert.equal(valid.data.inStock, true);
    assert.equal(valid.data.page, 2);

    const invalid = bookQuerySchema.safeParse({ sort: "1; DROP TABLE books" });
    assert.equal(invalid.success, false);
  });

  it("validates loginSchema and checkoutSchema", () => {
    assert.equal(loginSchema.safeParse({ username: "", password: "" }).success, false);
    assert.equal(
      loginSchema.safeParse({ username: "booklover", password: "password123" }).success,
      true,
    );
    assert.equal(
      loginSchema.safeParse({ email: "admin@booksore.local", password: "secret" }).success,
      true,
    );

    assert.equal(checkoutSchema.safeParse({ items: [] }).success, false);
    assert.equal(
      checkoutSchema.safeParse({
        items: [{ bookId: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 }],
      }).success,
      true,
    );
  });

  it("validates registerSchema with alphanumeric username and min password length", () => {
    assert.equal(registerSchema.safeParse({ username: "ab", password: "123" }).success, false);
    assert.equal(registerSchema.safeParse({ username: "bad user!", password: "secret123" }).success, false);
    const valid = registerSchema.safeParse({ username: "book_reader99", password: "mypassword" });
    assert.equal(valid.success, true);
    assert.equal(valid.data.username, "book_reader99");
  });

  it("validates admin role updates and member list filters", () => {
    assert.equal(updateUserRoleSchema.safeParse({ role: "admin" }).success, true);
    assert.equal(updateUserRoleSchema.safeParse({ role: "customer" }).success, true);
    assert.equal(updateUserRoleSchema.safeParse({ role: "owner" }).success, false);

    const parsed = userListQuerySchema.safeParse({
      q: "  maria  ",
      role: "customer",
      page: "2",
      limit: "50",
    });
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.q, "maria");
    assert.equal(parsed.data.page, 2);
    assert.equal(parsed.data.limit, 50);
    assert.equal(userListQuerySchema.safeParse({ role: "superuser" }).success, false);
    assert.equal(userListQuerySchema.safeParse({ limit: "500" }).success, false);
  });
});
