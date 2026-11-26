# Express Backend Template (TypeScript)

A clean Express 5 starter with TypeScript, Prisma 7, Passport auth, and strict linting.
Start a new project from this template and go straight to building features.

## Quick start (local Postgres)

1. Create your project from this template and enter the folder.
2. Install dependencies. The `postinstall` script generates the Prisma client.

   ```bash
   npm install
   ```

3. Create your local environment file and fill in the values.

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — your local Postgres connection string.
   - `JWT_SECRET` — a long random string used to sign JWTs.

4. Create the database tables from the schema.

   ```bash
   npm run prisma:migrate -- --name init
   ```

5. Start the server.

   ```bash
   npm run dev
   ```

The example health endpoint is at `GET /health`.

## Scripts

| Command                   | What it does                             |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Run the server with hot reload           |
| `npm run build`           | Compile TypeScript to `dist/`            |
| `npm run start`           | Run the compiled server                  |
| `npm run typecheck`       | Check types without emitting files       |
| `npm run lint`            | Check code with ESLint                   |
| `npm run lint:fix`        | Fix ESLint issues where possible         |
| `npm run format`          | Format files with Prettier               |
| `npm run format:check`    | Check formatting                         |
| `npm test`                | Run tests                                |
| `npm run test:watch`      | Run tests in watch mode                  |
| `npm run prisma:generate` | Generate the Prisma client               |
| `npm run prisma:migrate`  | Create and apply a development migration |
| `npm run prisma:push`     | Push schema changes without a migration  |
| `npm run prisma:studio`   | Open Prisma Studio                       |

## Folder map

```
src/
  app.ts            Express app setup and middleware order
  index.ts          Server entry point
  controllers/      Request handlers
  errors/           AppError used by the error handlers
  lib/              Prisma client, env helper, and Passport strategies
  middleware/       requireAuth guard, 404 and error handlers
  routes/           Express routers
prisma/
  schema.prisma     Database schema (includes a minimal User model)
tests/              Vitest tests (create this folder when you add your first test)
```

## Adding a feature

1. Add a router in `src/routes/` and a controller in `src/controllers/`.
2. Mount the router in `src/app.ts` above the not-found handler.
3. Use `AppError` from `src/errors/` for expected errors.
4. Use `requireAuth` from `src/middleware/` on routes that need a logged-in user.
5. After changing `prisma/schema.prisma`, run `npm run prisma:generate` and create a migration.
