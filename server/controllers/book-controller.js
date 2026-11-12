import {
  bookQuerySchema,
  checkoutSchema,
  createBookSchema,
  idParamSchema,
  updateBookSchema,
} from "../validation/schemas.js";
import { ValidationError } from "../errors/domain-errors.js";

function parseWithSchema(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    throw new ValidationError("Request payload validation failed", details);
  }
  return result.data;
}

export function createBookController(bookService) {
  return {
    list(req, res) {
      const query = parseWithSchema(bookQuerySchema, req.query);
      const { items, meta } = bookService.listBooks(query);
      res.status(200).json({ data: items, meta });
    },

    getById(req, res) {
      const { id } = parseWithSchema(idParamSchema, req.params);
      const book = bookService.getBook(id);
      res.status(200).json({ data: book });
    },

    create(req, res) {
      const payload = parseWithSchema(createBookSchema, req.body);
      const book = bookService.createBook(payload);
      res.status(201).setHeader("Location", `/api/v1/books/${book.id}`).json({ data: book });
    },

    update(req, res) {
      const { id } = parseWithSchema(idParamSchema, req.params);
      const updates = parseWithSchema(updateBookSchema, req.body);
      const book = bookService.updateBook(id, updates);
      res.status(200).json({ data: book });
    },

    remove(req, res) {
      const { id } = parseWithSchema(idParamSchema, req.params);
      bookService.deleteBook(id);
      res.status(204).end();
    },

    checkout(req, res) {
      const { items } = parseWithSchema(checkoutSchema, req.body);
      const receipt = bookService.checkout(items);
      res.status(200).json({ data: receipt });
    },
  };
}
