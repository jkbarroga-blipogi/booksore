# Bookstore App

Full-stack Bookstore inventory and catalog CRUD web application built with Node.js (`node:sqlite`), Express, Zod, and vanilla ES modules.

## Local Setup

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

## API Endpoints

- `GET /api/v1/health`
- `GET /api/v1/books` (`q`, `genre`, `sort`, `order`, `page`, `limit`)
- `GET /api/v1/books/:id`
- `POST /api/v1/books`
- `PATCH /api/v1/books/:id`
- `DELETE /api/v1/books/:id`

## Render Deployment

Includes `render.yaml` Blueprint. Connect your GitHub repository in Render and deploy as a Blueprint or Node Web Service (`npm install` / `npm start`, health check `/api/v1/health`).
