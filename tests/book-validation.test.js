import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createBookSchema,
  updateBookSchema,
  bookQuerySchema,
  idParamSchema,
} from "../src/validation/book-schemas.js";

describe("book-schemas", () => {
  it("validates a complete book payload and normalizes fields", () => {
    const result = createBookSchema.safeParse({
      title: "  The Pragmatic Programmer  ",
      author: "David Thomas, Andrew Hunt",
      isbn: "978-0-13-595705-9",
      genre: "Technology",
      priceCents: 4999,
      stock: 12,
      publishedYear: 2019,
      description: "Your journey to mastery.",
    });

    assert.equal(result.success, true);
    assert.equal(result.data.title, "The Pragmatic Programmer");
    assert.equal(result.data.isbn, "9780135957059");
    assert.equal(result.data.priceCents, 4999);
  });

  it("rejects negative price, negative stock, and malformed ISBN", () => {
    const result = createBookSchema.safeParse({
      title: "Bad Book",
      author: "Author",
      isbn: "not-an-isbn",
      genre: "Fiction",
      priceCents: -100,
      stock: -1,
      publishedYear: 2020,
    });

    assert.equal(result.success, false);
    const paths = result.error.issues.map((i) => i.path.join("."));
    assert.ok(paths.includes("isbn"));
    assert.ok(paths.includes("priceCents"));
    assert.ok(paths.includes("stock"));
  });

  it("requires at least one field in updateBookSchema", () => {
    const empty = updateBookSchema.safeParse({});
    assert.equal(empty.success, false);

    const partial = updateBookSchema.safeParse({ stock: 5 });
    assert.equal(partial.success, true);
    assert.equal(partial.data.stock, 5);
  });

  it("parses query parameters with safe defaults and rejects unknown sort keys", () => {
    const defaults = bookQuerySchema.safeParse({});
    assert.equal(defaults.success, true);
    assert.deepEqual(defaults.data, {
      page: 1,
      limit: 12,
      sort: "createdAt",
      order: "desc",
    });

    const badSort = bookQuerySchema.safeParse({ sort: "title; DROP TABLE books" });
    assert.equal(badSort.success, false);
  });

  it("validates UUID id parameter", () => {
    const valid = idParamSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    assert.equal(valid.success, true);

    const invalid = idParamSchema.safeParse({ id: "123" });
    assert.equal(invalid.success, false);
  });
});
