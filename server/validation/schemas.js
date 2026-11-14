import { z } from "zod";

const ISBN_PATTERN = /^(?:\d{9}[\dX]|\d{13})$/;

function normalizeIsbn(raw) {
  return raw.replace(/[\s-]+/g, "").toUpperCase();
}

function isSafeCoverUrl(value) {
  if (!value) return true;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const coverUrlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .default("")
  .refine(isSafeCoverUrl, {
    message: "Cover URL must be an http(s) URL or relative path",
  });

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
  coverUrl: coverUrlSchema,
  featured: z.boolean().optional().default(false),
});

export const createBookSchema = bookBaseSchema;

export const updateBookSchema = bookBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

function parseOptionalBool(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

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
  featured: z.preprocess(parseOptionalBool, z.boolean().optional()),
  inStock: z.preprocess(parseOptionalBool, z.boolean().optional()),
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

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
});

export const loginSchema = z
  .object({
    username: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().max(200).optional(),
    password: z.string().min(1, "Password is required").max(200),
  })
  .refine((data) => Boolean(data.username || data.email), {
    message: "Username or email is required",
    path: ["username"],
  });

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: z.string().uuid("Invalid book ID format"),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Cart cannot be empty")
    .max(50),
});
