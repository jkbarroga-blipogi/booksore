import crypto from "node:crypto";
import { hashPassword } from "../auth/password.js";
import { BookRepository } from "../repositories/book-repository.js";
import { UserRepository } from "../repositories/user-repository.js";

const STARTER_BOOKS = [
  {
    title: "Piranesi",
    author: "Susanna Clarke",
    isbn: "9781635575637",
    genre: "Literary Fiction",
    priceCents: 1850,
    stock: 11,
    publishedYear: 2020,
    description:
      "Piranesi lives in the House: infinite halls lined with statues, where an ocean is imprisoned within rooms.",
    coverUrl: "",
    featured: true,
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    isbn: "9780441478125",
    genre: "Science Fiction",
    priceCents: 1799,
    stock: 7,
    publishedYear: 1969,
    description:
      "An envoy is sent to Winter, an icy alien world where inhabitants have no fixed gender.",
    coverUrl: "",
    featured: true,
  },
  {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "9781449373320",
    genre: "Technology",
    priceCents: 4600,
    stock: 3,
    publishedYear: 2017,
    description:
      "The big ideas behind reliable, scalable, and maintainable distributed systems.",
    coverUrl: "",
    featured: true,
  },
  {
    title: "Pachinko",
    author: "Min Jin Lee",
    isbn: "9781455563920",
    genre: "Historical Fiction",
    priceCents: 1995,
    stock: 9,
    publishedYear: 2017,
    description:
      "Four generations of an immigrant Korean family navigate love, resilience, and identity in Japan.",
    coverUrl: "",
    featured: true,
  },
  {
    title: "Braiding Sweetgrass",
    author: "Robin Wall Kimmerer",
    isbn: "9781571313560",
    genre: "Essays & Nature",
    priceCents: 2000,
    stock: 14,
    publishedYear: 2013,
    description:
      "Indigenous wisdom, scientific knowledge, and the teachings of plants woven into luminous essays.",
    coverUrl: "",
    featured: false,
  },
  {
    title: "The Timeless Way of Building",
    author: "Christopher Alexander",
    isbn: "9780195024029",
    genre: "Architecture",
    priceCents: 3850,
    stock: 2,
    publishedYear: 1979,
    description:
      "Foundational exploration of pattern languages and spaces that feel deeply alive.",
    coverUrl: "",
    featured: false,
  },
  {
    title: "Invisible Cities",
    author: "Italo Calvino",
    isbn: "9780156453806",
    genre: "Literary Fiction",
    priceCents: 1595,
    stock: 0,
    publishedYear: 1972,
    description:
      "Marco Polo describes fifty-five imagined cities to an aging Kublai Khan in crystalline prose.",
    coverUrl: "",
    featured: false,
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    isbn: "9780593135204",
    genre: "Science Fiction",
    priceCents: 2299,
    stock: 12,
    publishedYear: 2021,
    description:
      "A lone astronaut wakes up light-years from Earth with an extinction-level puzzle to solve.",
    coverUrl: "",
    featured: false,
  },
  {
    title: "The Elements of Typographic Style",
    author: "Robert Bringhurst",
    isbn: "9780881792126",
    genre: "Design",
    priceCents: 3495,
    stock: 5,
    publishedYear: 2012,
    description:
      "The enduring classic on page proportions, letterforms, and thoughtful book craft.",
    coverUrl: "",
    featured: false,
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "9780062316110",
    genre: "History",
    priceCents: 2499,
    stock: 8,
    publishedYear: 2015,
    description:
      "How cognitive, agricultural, and scientific revolutions shaped human societies.",
    coverUrl: "",
    featured: false,
  },
];

export async function seedDatabase(db, options = {}) {
  const bookRepo = new BookRepository(db);
  const userRepo = new UserRepository(db);

  const stats = bookRepo.getStats();
  if (stats.totalTitles === 0) {
    for (const book of STARTER_BOOKS) {
      bookRepo.create(book);
    }
  }

  if (userRepo.countAdmins() === 0) {
    const email = options.adminEmail || process.env.ADMIN_EMAIL;
    let password = options.adminPassword || process.env.ADMIN_PASSWORD;

    if (email && password) {
      const passwordHash = await hashPassword(password);
      userRepo.createAdmin({ email, passwordHash });
    } else if (process.env.NODE_ENV !== "production") {
      const fallbackEmail = email || "admin@booksore.local";
      password = crypto.randomBytes(12).toString("hex");
      const passwordHash = await hashPassword(password);
      userRepo.createAdmin({ email: fallbackEmail, passwordHash });
      if (!options.silent) {
        console.info(
          JSON.stringify({
            level: "info",
            event: "admin_dev_seeded",
            email: fallbackEmail,
            generatedPassword: password,
          }),
        );
      }
    } else if (!options.silent) {
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "admin_seed_skipped",
          reason: "ADMIN_EMAIL and ADMIN_PASSWORD must be configured",
        }),
      );
    }
  }
}
