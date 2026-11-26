# Plan

<!-- Keep this structure. Agents: update it when the goal, steps, or decisions change. -->

## Goal

Provide a ready-to-clone TypeScript Express template that needs no cleanup before feature work.

## Status

Done

## Steps

1. [x] Set up Express, TypeScript, ESLint, Prettier, and npm scripts.
2. [x] Set up Prisma 7 with a User model and client generation.
3. [x] Set up Passport local and JWT strategies with a requireAuth guard.
4. [x] Add AppError and the 404/500 error handlers.
5. [x] Remove example-only content and add a README quick start.

## Decisions

- npm is the package manager because the lockfile already uses it.
- TypeScript stays at 5.9.3 because typescript-eslint does not support TypeScript 7 yet.
- Prisma uses prisma7.config.ts to match prisma init output.
- Prisma client generation runs on postinstall so a fresh clone builds immediately.
- Auth setup lives in one file, src/lib/passport.ts, with requireAuth in src/middleware/auth.ts.
- The health route and controller stay as the only example endpoint.

## Notes

- Never edit .env. Copy .env.example and fill in DATABASE_URL and JWT_SECRET.
- Run npm run prisma:migrate -- --name init after setting DATABASE_URL.
- Run lint, format:check, typecheck, build, and test before calling work done.
