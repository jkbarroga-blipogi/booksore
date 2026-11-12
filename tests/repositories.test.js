import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createDatabase } from "../server/db/database.js";
import { BookRepository } from "../server/repositories/book-repository.js";
import { UserRepository } from "../server/repositories/user-repository.js";
import { ConflictError } from "../server/errors/domain-errors.js";

describe("repositories", () => {
  let db;
  let bookRepo;
  let userRepo;

  beforeEach(() => {
    db = createDatabase(":memory:");
    bookRepo = new BookRepository(db);
    userRepo = new UserRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it("creates, queries, updates, and deletes books including featured and coverUrl", () => {
    const created = bookRepo.create({
      title: "The Left Hand of Darkness",
      author: "Ursula K. Le Guin",
      isbn: "9780441478125",
      genre: "Science Fiction",
      priceCents: 1799,
      stock: 5,
      publishedYear: 1969,
      description: "Winter planet diplomacy.",
      coverUrl: "",
      featured: true,
    });

    assert.equal(created.featured, true);
    assert.equal(created.coverUrl, "");

    const featuredOnly = bookRepo.findAll({ featured: true });
    assert.equal(featuredOnly.total, 1);

    const updated = bookRepo.update(created.id, { featured: false, stock: 0 });
    assert.equal(updated.featured, false);
    assert.equal(updated.stock, 0);

    const inStockOnly = bookRepo.findAll({ inStock: true });
    assert.equal(inStockOnly.total, 0);

    assert.equal(bookRepo.remove(created.id), true);
    assert.equal(bookRepo.findById(created.id), null);
  });

  it("performs atomic checkout and rejects entire cart when any book lacks stock", () => {
    const bookA = bookRepo.create({
      title: "Book A",
      author: "Author A",
      isbn: "9780000000011",
      genre: "Fiction",
      priceCents: 1500,
      stock: 4,
      publishedYear: 2020,
      description: "",
      coverUrl: "",
      featured: false,
    });

    const bookB = bookRepo.create({
      title: "Book B",
      author: "Author B",
      isbn: "9780000000022",
      genre: "Fiction",
      priceCents: 2000,
      stock: 0,
      publishedYear: 2021,
      description: "",
      coverUrl: "",
      featured: false,
    });

    assert.throws(
      () =>
        bookRepo.checkoutItems([
          { bookId: bookA.id, quantity: 2 },
          { bookId: bookB.id, quantity: 1 },
        ]),
      (err) => err instanceof ConflictError && Array.isArray(err.details) && err.details.length === 1,
    );

    // Verify Book A was NOT decremented due to rollback
    assert.equal(bookRepo.findById(bookA.id).stock, 4);

    // Valid checkout decrements stock and computes total
    const receipt = bookRepo.checkoutItems([{ bookId: bookA.id, quantity: 2 }]);
    assert.equal(receipt.totalCents, 3000);
    assert.equal(bookRepo.findById(bookA.id).stock, 2);
  });

  it("stores and finds admin users by email", () => {
    const user = userRepo.createAdmin({
      email: "admin@booksore.local",
      passwordHash: "salt:hash",
    });

    assert.equal(user.role, "admin");
    assert.equal(userRepo.countAdmins(), 1);
    assert.equal(userRepo.findByEmail("admin@booksore.local").id, user.id);
  });
});
