# 🎬 Movie Watchlist API

A RESTful backend API that lets users manage a personal movie database and watchlist. Users register, add movies, and track their watch status with ratings and notes.

**Stack:** Node.js · Express 5 · PostgreSQL (Neon) · Prisma ORM · Zod · JWT · Render

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

- **User auth** — Register, login, and logout with JWT (cookie + Bearer token support)
- **Movie management** — Add and update movies; only the creator can edit their entries
- **Personal watchlist** — Add any movie to your list, track status, leave a rating (1–10) and notes
- **Zod validation** — All request bodies are validated before hitting the database
- **Prisma error handling** — Unique constraint violations and foreign key errors are mapped to clean HTTP responses
- **Graceful shutdown** — Handles `SIGTERM`, uncaught exceptions, and unhandled promise rejections cleanly

---

## Tech Stack

| Layer | Tool |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Prisma 6 |
| Validation | Zod 4 |
| Auth | JWT + bcryptjs |
| Dev server | nodemon |
| API testing | Requestly |
| Hosting | [Render](https://render.com) |

---

## Project Structure

```
movie-watchlist/
├── prisma/
│   ├── schema.prisma          # Data models: User, Movie, WatchlistItem
│   ├── seed.js                # 10 sample movies for local dev
│   └── migrations/            # Auto-generated SQL migration history
│
└── src/
    ├── server.js              # App entry point, route mounting, graceful shutdown
    ├── config/
    │   └── db.js              # Prisma client + connect/disconnect helpers
    ├── routes/
    │   ├── authRoutes.js      # /auth/*
    │   ├── movieRoutes.js     # /movies/*
    │   └── watchlistRoutes.js # /watchlist/*
    ├── controllers/
    │   ├── authController.js
    │   ├── movieController.js
    │   └── watchlistController.js
    ├── middleware/
    │   ├── authMiddleware.js  # JWT verification, attaches req.user
    │   ├── validateRequest.js # Zod schema wrapper
    │   └── errorMiddleware.js # Global error handler + 404 handler
    ├── validators/
    │   ├── authValidators.js
    │   ├── movieValidators.js
    │   └── addToWatchlistSchema.js
    └── utils/
        └── generateToken.js   # Signs JWT, sets httpOnly cookie
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A [Neon](https://neon.tech) account (or any PostgreSQL instance)
- npm

### 1 — Clone the repo

```bash
git clone https://github.com/balakrishram/movie-watchlist.git
cd movie-watchlist
```

### 2 — Install dependencies

```bash
npm install
```

### 3 — Configure environment

Copy the example below, create a `.env` file in the project root, and fill in your values:

```bash
cp .env.example .env   # or create it manually — see Environment Variables below
```

### 4 — Push the schema and run migrations

```bash
npx prisma migrate deploy
```

> For local development with auto-migration on schema changes, use `npx prisma migrate dev` instead.

### 5 — (Optional) Seed sample movies

```bash
npm run seed:movies
```

> The seed script requires a user with a specific UUID already in your database. Update `prisma/seed.js` → `userId` to match a real user ID before running.

### 6 — Start the dev server

```bash
npm run dev
```

The server starts on `http://localhost:5001` by default.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string from Neon (or any Postgres provider)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"

# Secret key used to sign JWTs — use a long random string in production
JWT_SECRET="your-super-secret-key"

# Token expiry duration (e.g. 7d, 24h, 1h)
JWT_EXPIRES_IN="7d"

# Server port — Render injects this automatically; defaults to 5001 locally
PORT=5001

# "development" enables Prisma query logging and stack traces in error responses
NODE_ENV="development"
```

> **Never commit `.env` to version control.** Add it to `.gitignore`.

---

## Database Setup

The schema defines three models:

**`User`** — Stores registered users. Email is unique. Password is bcrypt-hashed.

**`Movie`** — A movie entry. Each movie has a `createdBy` foreign key linking it to its creator. Title must be unique (enforced in the controller).

**`WatchlistItem`** — Joins a user to a movie. The `(userId, movieId)` pair is unique — you can only add a movie to your list once.

```
User ──< Movie          (one user creates many movies)
User ──< WatchlistItem  (one user has many watchlist entries)
Movie ──< WatchlistItem (one movie appears in many watchlists)
```

**WatchListStatus enum:**

| Value | Meaning |
|---|---|
| `PLANNED` | Want to watch (default) |
| `WATCHING` | Currently watching |
| `COMPLETED` | Finished |
| `DROPPED` | Stopped watching |

---

## API Reference

All routes return JSON. Protected routes require a valid JWT — see [Authentication](#authentication).

### Auth — `/auth`

#### `POST /auth/register`

Register a new user.

**Request body:**
```json
{
  "name": "Balakrishnan",
  "email": "bala@example.com",
  "password": "secret123"
}
```

**Response `201`:**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "name": "Balakrishnan", "email": "bala@example.com" },
    "token": "<jwt>"
  }
}
```

---

#### `POST /auth/login`

Log in and receive a JWT.

**Request body:**
```json
{
  "email": "bala@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "bala@example.com" },
    "token": "<jwt>"
  }
}
```

---

#### `POST /auth/logout`

Clears the JWT cookie.

**Response `200`:**
```json
{ "message": "Logged out successfully", "status": "success" }
```

---

### Movies — `/movies` 🔒

All movie routes require authentication.

#### `POST /movies`

Add a new movie to the database.

**Request body:**
```json
{
  "title": "Inception",
  "releaseYear": 2010,
  "overview": "A thief who steals corporate secrets through dream-sharing technology.",
  "genres": ["Action", "Sci-Fi", "Thriller"],
  "runtime": 148,
  "posterUrl": "https://example.com/inception.jpg"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | Must be unique in the database |
| `releaseYear` | integer | ✅ | 1888 – current year + 10 |
| `overview` | string | ❌ | |
| `genres` | string[] | ❌ | |
| `runtime` | integer | ❌ | Minutes; must be positive |
| `posterUrl` | string | ❌ | Must be a valid URL |

**Response `201`:**
```json
{
  "message": "Movie created successfully",
  "movie": { "id": "uuid", "title": "Inception", ... }
}
```

---

#### `PUT /movies/:id`

Update a movie. Only the creator of the movie can update it.

**Request body** (all fields optional):
```json
{
  "releaseYear": 2026
}
```

**Response `200`:**
```json
{
  "message": "Movie updated successfully",
  "movie": { "id": "uuid", "title": "Obsession", "releaseYear": 2026, ... }
}
```

---

### Watchlist — `/watchlist` 🔒

All watchlist routes require authentication. Users can only manage their own watchlist items.

#### `POST /watchlist`

Add a movie to your personal watchlist.

**Request body:**
```json
{
  "movieId": "36a793ce-2d32-4c97-a8fb-fae00f9e4337",
  "status": "PLANNED",
  "rating": 9,
  "notes": "Loved the ending"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `movieId` | UUID | ✅ | Must exist in the Movie table |
| `status` | enum | ❌ | `PLANNED`, `WATCHING`, `COMPLETED`, `DROPPED`. Defaults to `PLANNED` |
| `rating` | integer | ❌ | 1–10 |
| `notes` | string | ❌ | Max 200 characters |

**Response `201`:**
```json
{
  "status": "success",
  "data": { "watchlistItem": { "id": "uuid", ... } }
}
```

---

#### `PUT /watchlist/:id`

Update a watchlist item's status, rating, or notes. Only the owner can update.

**Request body** (all optional):
```json
{
  "status": "COMPLETED",
  "rating": 10,
  "notes": "One of the best films I've seen"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "message": "Watchlist item updated successfully",
  "data": { "watchlistItem": { ... } }
}
```

---

#### `DELETE /watchlist/:id`

Remove a movie from your watchlist. Only the owner can delete.

**Response `200`:**
```json
{
  "status": "success",
  "message": "Watchlist item removed successfully",
  "data": { "watchlistItem": { ... } }
}
```

---

## Authentication

The API issues a JWT on register and login. Pass it in one of two ways:

**Authorization header (recommended for API clients):**
```
Authorization: Bearer <token>
```

**Cookie (set automatically by the server on login):**
```
Cookie: jwt=<token>
```

The token expires after `JWT_EXPIRES_IN` (default: 7 days). The `authMiddleware` verifies the token and attaches the full user object to `req.user` for downstream handlers.

---

## Error Handling

The global error handler (`errorMiddleware.js`) maps Prisma errors to clean HTTP responses:

| Prisma Code | HTTP | Message |
|---|---|---|
| `P2002` | 400 | `<field> already exists` |
| `P2025` | 404 | `Record not found` |
| `P2003` | 400 | `Invalid reference: related record does not exist` |
| `PrismaClientValidationError` | 400 | `Invalid data provided` |

In `development` mode, error responses include a `stack` field for easier debugging. In `production`, only `status` and `message` are returned.

Zod validation errors are flattened and joined into a single readable string, e.g.:

```json
{ "message": "Name must be at least 2 characters, Please provide a valid email" }
```

---

## Deployment

This project is deployed on **Render** as a Node.js web service, with the database hosted on **Neon** (serverless PostgreSQL).

### Steps to deploy on Render

1. Push your code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com) and connect your repo.
3. Set the following in the Render environment settings:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | A strong random secret |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `PORT` | Leave blank — Render injects this automatically |

4. Set the **Start Command** to:
   ```bash
   node src/server.js
   ```

5. Optionally add a **Build Command**:
   ```bash
   npx prisma generate && npx prisma migrate deploy
   ```

> The free Render tier spins down on inactivity. First requests after a cold start may take 50+ seconds. Upgrade to a paid instance to avoid this.

---

## Contributing

1. Fork the repo and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes. Follow the existing code style — ES modules, async/await, Zod for all new request schemas.

3. Test your endpoints manually using [Requestly](https://requestly.com) or any REST client.

4. Commit with a clear message:
   ```bash
   git commit -m "feat: add movie search by genre"
   ```

5. Push and open a Pull Request against `main`. Describe what you changed and why.

### Good first contributions

- Add `GET /movies` — list all movies with optional genre/year filters
- Add `GET /watchlist` — return the authenticated user's full watchlist
- Add pagination to list endpoints
- Write integration tests with a test database

---

## License

ISC