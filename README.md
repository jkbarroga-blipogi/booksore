# Booksore

Editorial bookstore storefront, member accounts, shopping cart checkout, and an admin desk
for inventory and member roles. Built with React, Vite, Express, Zod, and Node SQLite
(`node:sqlite`).

## Access Model

- The bookstore is private. `/login` and `/signup` are the only public pages.
- Signed-in customers can browse `/store`, checkout, and view their orders.
- Only accounts with the `admin` role can open `/admin`.
- Admins manage inventory and change member roles. A role change applies to the member's
  live session immediately, and an admin cannot remove their own admin access.
- Every catalog, checkout, order, and member endpoint checks the session on the server. The
  interface gate is not the only protection.

## Local Setup

1. Copy `.env.example` to `.env` and set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
2. Install dependencies and start:

```bash
npm install
npm run dev:api
npm run dev:web
```

Or build and run the unified server:

```bash
npm run build
npm start
```

Open `http://localhost:3000/login`.

The seeded admin account uses the username `admin` and the configured `ADMIN_EMAIL`. Sign in
with either identifier and the configured password.

## Tests

```bash
npm test
```

## Routes

- `/login`: member sign in
- `/signup`: customer account creation
- `/store`: private storefront and checkout
- `/admin`: admin desk with inventory and member tabs

## API Endpoints

Public:

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Signed-in session:

- `GET /api/v1/books` (`q`, `genre`, `featured`, `inStock`, `sort`, `order`, `page`, `limit`)
- `GET /api/v1/books/:id`
- `POST /api/v1/checkout`
- `GET /api/v1/orders/my-orders`

Admin session:

- `POST /api/v1/books`
- `PATCH /api/v1/books/:id`
- `DELETE /api/v1/books/:id`
- `GET /api/v1/users` (`q`, `role`, `page`, `limit`)
- `PATCH /api/v1/users/:id/role` with `{ "role": "customer" | "admin" }`

## Render Deployment

Includes a `render.yaml` Blueprint. Connect the GitHub repository in Render as a Blueprint
or Web Service and provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

On Vercel, `vercel.json` rewrites `/api/*` to the Render service and serves the application
shell for `/login`, `/signup`, `/store`, and `/admin`.
