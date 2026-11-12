import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createDatabase } from "../src/db/database.js";
import { BookRepository } from "../src/repositories/book-repository.js";

describe("BookRepository", () => {
  let db;
  let repo;

  beforeEach(() => {
    db = createDatabase(":memory:");
    repo = new BookRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it("creates and retrieves a book by id and isbn", () => {
    const created = repo.create({
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      isbn: "9781449373320",
      genre: "Technology",
      priceCents: 4500,
      stock: 8,
      publishedYear: 2017,
      description: "Big ideas behind reliable, scalable, and maintainable systems.",
    });

    assert.ok(created.id);
    assert.equal(created.title, "Designing Data-Intensive Applications");
    assert.equal(created.stock, 8);

    const byId = repo.findById(created.id);
    assert.deepEqual(byId, created);

    const byIsbn = repo.findByIsbn("9781449373320");
    assert.equal(byIsbn.id, created.id);
  });

  it("filters by search term and genre with pagination", () => {
    repo.create({
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441172719",
      genre: "Science Fiction",
      priceCents: 1899,
      stock: 15,
      publishedYear: 1965,
      description: "Desert planet Arrakis.",
    });
    repo.create({
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "9780132350884",
      genre: "Technology",
      priceCents: 3999,
      stock: 4,
      publishedYear: 2008,
      description: "Handbook of agile software craftsmanship.",
    });
    repo.create({
      title: "Foundation",
      author: "Isaac Asimov",
      isbn: "9780553293357",
      genre: "Science Fiction",
      priceCents: 1499,
      stock: 0,
      publishedYear: 1951,
      description: "Galactic Empire saga.",
    });

    const sciFi = repo.findAll({
      genre: "Science Fiction",
      page: 1,
      limit: 10,
      sort: "priceCents",
      order: "asc",
    });

    assert.equal(sciFi.total, 2);
    assert.equal(sciFi.items[0].title, "Foundation");
    assert.equal(sciFi.items[1].title, "Dune");

    const search = repo.findAll({
      q: "Herbert",
      page: 1,
      limit: 10,
      sort: "createdAt",
      order: "desc",
    });
    assert.equal(search.total, 1);
    assert.equal(search.items[0].title, "Dune");
  });

  it("updates and removes a book", () => {
    const created = repo.create({
      title: "Refactoring",
      author: "Martin Fowler",
      isbn: "9780134757599",
      genre: "Technology",
      priceCents: 5200,
      stock: 3,
      publishedYear: 2018,
      description: "Improving the design of existing code.",
    });

    const updated = repo.update(created.id, { stock: 10, priceCents: 4800 });
    assert.equal(updated.stock, 10);
    assert.equal(updated.priceCents, 4800);
    assert.equal(updated.title, "Refactoring");

    const removed = repo.remove(created.id);
    assert.equal(removed, true);
    assert.equal(repo.findById(created.id), null);
    assert.equal(repo.remove(created.id), false);
  });

  it("returns catalog summary stats", () => {
    repo.create({
      title: "Book One",
      author: "Author A",
      isbn: "9780000000001",
      genre: "Fiction",
      priceCents: 1200,
      stock: 2,
      publishedYear: 2020,
      description: "",
    });
    repo.create({
      title: "Book Two",
      author: "Author B",
      isbn: "9780000000002",
      genre: "History",
      priceCents: 2500,
      stock: 10,
      publishedYear: 2021,
      description: "",
    });

    const stats = repo.getStats();
    assert.equal(stats.totalTitles, 2);
    assert.equal(stats.totalUnits, 12);
    assert.equal(stats.lowStockCount, 1);
    assert.deepEqual(stats.genres, ["Fiction", "History"]);
  });
});
