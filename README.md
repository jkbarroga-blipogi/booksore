# Booksore

Editorial bookstore storefront, shopping cart checkout, and admin inventory CRUD app built with React, Vite, Express, Zod, and Node SQLite (`node:sqlite`).

## Local Setup

1. Copy `.env.example` to `.env` and set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
2. Install dependencies and start:

```bash
npm install
npm run dev:api
npm run dev:web
```

Or build and run unified server:

```bash
npm run build
npm start
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

## API Endpoints

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/books` (`q`, `genre`, `featured`, `inStock`, `sort`, `order`, `page`, `limit`)
- `GET /api/v1/books/:id`
- `POST /api/v1/books` (admin cookie required)
- `PATCH /api/v1/books/:id` (admin cookie required)
- `DELETE /api/v1/books/:id` (admin cookie required)
- `POST /api/v1/checkout`

## Render Deployment

Includes `render.yaml` Blueprint. Connect GitHub repository `booksore` in Render as a Blueprint or Web Service and provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.
