import { ConflictError, NotFoundError } from "../errors/domain-errors.js";

export class BookService {
  #bookRepo;

  constructor(bookRepo) {
    this.#bookRepo = bookRepo;
  }

  listBooks(query) {
    const { items, total } = this.#bookRepo.findAll(query);
    const stats = this.#bookRepo.getStats();
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        stats,
      },
    };
  }

  getBook(id) {
    const book = this.#bookRepo.findById(id);
    if (!book) {
      throw new NotFoundError(`Book ${id} was not found`);
    }
    return book;
  }

  createBook(data) {
    const existing = this.#bookRepo.findByIsbn(data.isbn);
    if (existing) {
      throw new ConflictError(`A book with ISBN ${data.isbn} already exists`);
    }
    return this.#bookRepo.create(data);
  }

  updateBook(id, updates) {
    const current = this.#bookRepo.findById(id);
    if (!current) {
      throw new NotFoundError(`Book ${id} was not found`);
    }

    if (updates.isbn && updates.isbn !== current.isbn) {
      const collision = this.#bookRepo.findByIsbn(updates.isbn);
      if (collision && collision.id !== id) {
        throw new ConflictError(`A book with ISBN ${updates.isbn} already exists`);
      }
    }

    return this.#bookRepo.update(id, updates);
  }

  deleteBook(id) {
    const deleted = this.#bookRepo.remove(id);
    if (!deleted) {
      throw new NotFoundError(`Book ${id} was not found`);
    }
  }

  checkout(items, userId = null) {
    return this.#bookRepo.checkoutItems(items, userId);
  }

  getMyOrders(userId) {
    return this.#bookRepo.getOrdersByUserId(userId);
  }
}
