# Blog API

A REST API for a blog where users write posts and readers comment on them.

![Screenshot of the Blog API running](./docs/screenshot.png)

**Live:** not deployed yet. Add the Render URL here after deployment.

## Why I built it

This is the backend for The Odin Project blog API exercise. The idea is to run one API that serves two separate websites: a public site for reading and commenting, and a private site for writing and publishing. Keeping the data in one API means both sites share the same rules, while each can be built and deployed on its own.

## Features

- Register, log in, log out, and read the current user.
- Create posts, keep them as drafts, publish them, edit them, and delete them. Only the author can change a post.
- Read published posts without logging in. Other users' drafts stay hidden.
- Add comments to published posts without an account. Only the post author can edit or delete those comments.
- Paginate post and comment lists with `?page=` and `?pageSize=`.
- Send the login token in an httpOnly cookie, so JavaScript cannot read it.
- Allow only the two configured front-end origins to call the API with cookies.
- Limit requests per IP, with a tighter limit on login and registration.
- Validate every request body, parameter, and query value before using it.

## Tech stack

- Express 5 and TypeScript
- Prisma 7 with PostgreSQL
- Passport for local login and JWT authentication
- express-validator, helmet, and express-rate-limit
- Vitest and Supertest for tests
- ESLint and Prettier for code quality
- Neon for the hosted database and Render for hosting

## Run it locally

You need Node.js and two PostgreSQL databases: one for the app and one for tests.

```bash
git clone git@github.com:uwaje-justice/blog-api.git
cd blog-api
cp .env.example .env
npm install
npm run db:migrate -- --name init
npm run dev
```

Fill in `.env` before running the migration. Never commit this file.

Required environment variables:

| Variable            | What it is for                               |
| ------------------- | -------------------------------------------- |
| `DATABASE_URL`      | Connection string for the app database       |
| `TEST_DATABASE_URL` | Connection string for the test database      |
| `JWT_SECRET`        | Long random string used to sign login tokens |
| `AUTHOR_CLIENT`     | Full URL of the writing front-end            |
| `PUBLIC_CLIENT`     | Full URL of the reading front-end            |

Optional environment variables:

| Variable              | What it is for                                                 |
| --------------------- | -------------------------------------------------------------- |
| `PORT`                | Server port, defaults to `3000`                                |
| `RATE_LIMIT_MAX`      | API requests per IP per 15 minutes, defaults to 100            |
| `AUTH_RATE_LIMIT_MAX` | Login and registration attempts per 15 minutes, defaults to 10 |

`npm run db:migrate` also migrates the test database through its post-migration hook. The health check is at `GET /health`.

## API overview

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Posts: `GET /api/posts`, `GET /api/posts/mine`, `GET /api/posts/:id`, `POST /api/posts`, `PATCH /api/posts/:id`, `DELETE /api/posts/:id`.
- Comments: `GET /api/posts/:postId/comments`, `POST /api/posts/:postId/comments`, `PATCH /api/comments/:id`, `DELETE /api/comments/:id`.

List responses include a `pagination` object. Errors use `{ "message": "...", "errors": {} }`. A request over the rate limit returns `429`.

Example: register, then publish a post with the saved cookie.

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"writer@example.com","password":"blog12345"}'

curl -b cookies.txt -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","content":"My first post","published":true}'
```

## Tests and checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
```

Tests use the database at `TEST_DATABASE_URL` and clear its tables between tests, so never point that variable at a database with real data. Unit tests live in `tests/unit/` and router tests in `tests/integration/`.

## Deployment

`render.yaml` is a Render Blueprint for the free plan. Push this repository to GitHub, then in Render choose **New > Blueprint** and select it. Render asks for `DATABASE_URL`, `JWT_SECRET`, `AUTHOR_CLIENT`, and `PUBLIC_CLIENT`; enter them in the dashboard, not in the repository. The blueprint sets `NODE_ENV=production` and uses the Frankfurt region to sit near the Neon database.

Each build installs packages, generates the Prisma client, compiles TypeScript, and runs `npm run db:deploy`. That command applies committed migrations and skips ones already applied, so it is safe to run on every deploy.

In production the login cookie uses `SameSite=None` and `Secure`, so each front-end must send credentials with every request:

```js
fetch("https://your-api.onrender.com/api/posts", { credentials: "include" });
```

## Links

- Author: Uwaje Justice
- Source code: https://github.com/uwaje-justice/blog-api
- Issues: https://github.com/uwaje-justice/blog-api/issues

## License

MIT
