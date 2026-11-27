# Blog API

A REST API for the Odin Project blog API project. Users can register, write and publish posts, and comment on published posts.
Built with Express 5, TypeScript, Prisma 7, Postgres, and Passport auth.

## Quick start (local Postgres)

1. Clone this repository and enter the folder.
2. Install dependencies. The `postinstall` script generates the Prisma client.

   ```bash
   npm install
   ```

3. Create your local environment file and fill in the values.

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — your local Postgres connection string.
   - `TEST_DATABASE_URL` — a separate Postgres database used by the tests.
   - `JWT_SECRET` — a long random string used to sign JWTs.

4. Create the database tables from the schema.

   ```bash
   npm run db:migrate -- --name init
   ```

   This also migrates the test database through the `postdb:migrate` hook.

5. Start the server.

   ```bash
   npm run dev
   ```

The health endpoint is at `GET /health`.

## API endpoints

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Posts: `GET /api/posts`, `GET /api/posts/mine`, `GET /api/posts/:id`, `POST /api/posts`, `PATCH /api/posts/:id`, `DELETE /api/posts/:id`.
- Comments: `GET /api/posts/:postId/comments`, `POST /api/posts/:postId/comments`, `PATCH /api/comments/:id`, `DELETE /api/comments/:id`.

List endpoints accept `?page=` and `?pageSize=`. Login sets an httpOnly cookie, so browser clients must send credentials with each request. Visitors can read and add comments on published posts, and only the post author can edit or delete those comments.

Rate limits are 100 requests per 15 minutes per IP on `/api`, and 10 per 15 minutes on `POST /api/auth/register` and `POST /api/auth/login`. Requests over the limit return `429` with a JSON message. The limits can be changed with `RATE_LIMIT_MAX` and `AUTH_RATE_LIMIT_MAX`.

## Scripts

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Run the server with hot reload                |
| `npm run build`        | Compile TypeScript to `dist/`                 |
| `npm run start`        | Run the compiled server                       |
| `npm run typecheck`    | Check types without emitting files            |
| `npm run lint`         | Check code with ESLint                        |
| `npm run lint:fix`     | Fix ESLint issues where possible              |
| `npm run format`       | Format files with Prettier                    |
| `npm run format:check` | Check formatting                              |
| `npm test`             | Run tests                                     |
| `npm run test:watch`   | Run tests in watch mode                       |
| `npm run db:generate`  | Generate the Prisma client                    |
| `npm run db:migrate`   | Create and apply migrations to both databases |
| `npm run db:deploy`    | Apply committed migrations once (for hosting) |
| `npm run db:push`      | Push schema changes without a migration       |
| `npm run db:studio`    | Open Prisma Studio                            |

## Deployment

`render.yaml` is a Render Blueprint for the free plan. Push this repo to GitHub, then in Render choose **New > Blueprint** and select the repository. Set these values in the Render dashboard when asked:

- `DATABASE_URL` — the connection string from your Neon project.
- `JWT_SECRET` — a long random string.
- `AUTHOR_CLIENT` — the full URL of the author front-end, for example `https://author.example.com`.
- `PUBLIC_CLIENT` — the full URL of the public front-end, for example `https://blog.example.com`.

Render sets `NODE_ENV=production` and `PORT` for you. The build installs packages, generates the Prisma client, builds TypeScript, and applies migrations to Neon. Keep both front-ends in the `AUTHOR_CLIENT` and `PUBLIC_CLIENT` values, or requests from them will be blocked.

In production the login cookie uses `SameSite=None` and `Secure`, so each front-end must send credentials with every request:

```js
fetch("https://your-api.onrender.com/api/posts", { credentials: "include" });
```

The `render.yaml` uses the Frankfurt region to sit near the Neon database in Frankfurt. Change both if you prefer another region.

## Folder map

```
src/
  app.ts            Express app setup and middleware order
  index.ts          Server entry point
  controllers/      Request handlers
  errors/           AppError used by the error handlers
  lib/              Prisma client, env helper, CORS, rate limits, Passport, pagination and request helpers
  middleware/       requireAuth guard, 404 and error handlers
  routes/           Express routers
prisma/
  schema.prisma     Database schema for users, posts, and comments
tests/              Vitest unit and integration tests
```

## Adding a feature

1. Add a router in `src/routes/` and a controller in `src/controllers/`.
2. Mount the router in `src/app.ts` above the not-found handler.
3. Use `AppError` from `src/errors/` for expected errors.
4. Use `requireAuth` from `src/middleware/` on routes that need a logged-in user.
5. After changing `prisma/schema.prisma`, run `npm run db:generate` and create a migration.
