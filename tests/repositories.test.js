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

  it("stores and finds admin users by email or username", () => {
    const user = userRepo.createAdmin({
      username: "admin",
      email: "admin@booksore.local",
      passwordHash: "salt:hash",
    });

    assert.equal(user.role, "admin");
    assert.equal(userRepo.countAdmins(), 1);
    assert.equal(userRepo.findByEmail("admin@booksore.local").id, user.id);
    assert.equal(userRepo.findByUsername("admin").id, user.id);
  });

  it("creates customer accounts and retrieves orders by user id", () => {
    const customer = userRepo.createCustomer({
      username: "juan_reader",
      passwordHash: "salt:custhash",
    });

    assert.equal(customer.role, "customer");
    assert.equal(customer.username, "juan_reader");
    assert.equal(userRepo.findByUsername("juan_reader").id, customer.id);
    const book = bookRepo.create({
      title: "Noli Me Tangere",
      author: "Jose Rizal",
      isbn: "9789710860500",
      genre: "Historical Fiction",
      priceCents: 45000,
      stock: 10,
      publishedYear: 1887,
      description: "Touch me not.",
      coverUrl: "",
      featured: true,
    });

    const receipt = bookRepo.checkoutItems([{ bookId: book.id, quantity: 1 }], customer.id);
    assert.ok(receipt.orderId);
    assert.equal(receipt.totalCents, 45000);

    const myOrders = bookRepo.getOrdersByUserId(customer.id);
    assert.equal(myOrders.length, 1);
    assert.equal(myOrders[0].orderId, receipt.orderId);
    assert.equal(myOrders[0].totalCents, 45000);
  });

  it("lists members with filters and updates roles", () => {
    userRepo.createAdmin({
      username: "admin",
      email: "admin@booksore.local",
      passwordHash: "salt:adminhash",
    });
    const customer = userRepo.createCustomer({
      username: "reader_one",
      passwordHash: "salt:custhash",
    });

    const all = userRepo.findAll({ page: 1, limit: 20 });
    assert.equal(all.total, 2);
    assert.equal(all.items[0].passwordHash, undefined);

    const admins = userRepo.findAll({ role: "admin" });
    assert.equal(admins.total, 1);
    assert.equal(admins.items[0].username, "admin");

    const searched = userRepo.findAll({ q: "reader" });
    assert.equal(searched.total, 1);
    assert.equal(searched.items[0].id, customer.id);

    const promoted = userRepo.updateRole(customer.id, "admin");
    assert.equal(promoted.role, "admin");
    assert.equal(userRepo.countAdmins(), 2);
    assert.equal(userRepo.updateRole("missing-id", "admin"), null);
  });
});
