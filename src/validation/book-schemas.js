import { z } from "zod";

const ISBN_PATTERN = /^(?:\d{9}[\dX]|\d{13})$/;

function normalizeIsbn(raw) {
  return raw.replace(/[\s-]+/g, "").toUpperCase();
}

const isbnSchema = z
  .string()
  .trim()
  .transform(normalizeIsbn)
  .refine((val) => ISBN_PATTERN.test(val), {
    message: "ISBN must be a valid 10-digit or 13-digit identifier",
  });

const bookBaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: z.string().trim().min(1, "Author is required").max(150),
  isbn: isbnSchema,
  genre: z.string().trim().min(1, "Genre is required").max(60),
  priceCents: z.number().int().min(0).max(10_000_000),
  stock: z.number().int().min(0).max(100_000),
  publishedYear: z.number().int().min(1450).max(2100),
  description: z.string().trim().max(2000).optional().default(""),
});

export const createBookSchema = bookBaseSchema;

export const updateBookSchema = bookBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const bookQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  genre: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sort: z
    .enum(["createdAt", "title", "author", "priceCents", "stock", "publishedYear"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid book ID format"),
});
