# Booksore

Editorial bookstore storefront, member accounts, shopping cart checkout, and an admin desk
for inventory and member roles. Built with React, Vite, Express, Zod, and Node SQLite
(`node:sqlite`).

## Access Model

- The storefront is private. Customers sign in at `/login` or register at `/signup`.
- Signed-in customers can browse `/store`, checkout, and view their orders.
- Admins sign in at `/admin/login` and go straight to `/admin`. The storefront has no admin link.
- Each sign-in endpoint checks the account role before issuing a session.
- Admins manage inventory and change member roles. A role change applies to the member's
  live session immediately, and an admin cannot remove their own admin access.
- Every catalog, checkout, order, and member endpoint checks the session on the server. The
  interface gate is not the only protection.

## Local Setup

1. Copy `.env.example` to `.env` and set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
2. Install dependencies and start both processes:

```bash
npm install
npm run dev
```

`npm run dev` starts the API on port 3000 and the web app on `http://localhost:5173`. The web
app proxies `/api` to the API, so sign-in only works while both processes run. You can also run
`npm run dev:api` and `npm run dev:web` in separate terminals.

Or build and run the unified server:

```bash
npm run build
npm start
```

With the unified server, open `http://localhost:3000/login` for customers or
`http://localhost:3000/admin/login` for admins. With `npm run dev`, use port 5173 instead.

The seeded admin account uses the username `admin` and the configured `ADMIN_EMAIL`. Use
either identifier at `/admin/login` with the password configured when the account was created.

## Tests

```bash
npm test
```

## Routes

- `/login`: customer sign-in
- `/signup`: customer account creation
- `/store`: private storefront and checkout
- `/admin/login`: admin sign-in
- `/admin`: admin desk with inventory and member tabs

## API Endpoints

Public:

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login` (customer accounts)
- `POST /api/v1/auth/admin/login` (admin accounts)
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
shell for `/login`, `/signup`, `/store`, `/admin/login`, and `/admin`.
