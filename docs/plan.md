# Blog API plan

## Goal

Build the REST API for The Odin Project blog API project.

The API serves two later front-ends: one for reading and commenting on posts, and one for writing posts. This plan covers the API only. The two websites come after the API works.

Source: [The Odin Project curriculum, Blog API project](https://raw.githubusercontent.com/TheOdinProject/curriculum/main/nodeJS/apis/project_blog_api.md).

## Current state

- Users can register, log in, log out, and read their own details.
- Users can create posts, list published posts, list their own posts, read one post, update posts, and delete posts.
- JWTs are sent in an httpOnly cookie named `token`.
- Posts have `title`, `content`, `published`, `authorId`, and timestamps.
- A `Comment` table exists in the database, but there is no comment route, controller, service, validator, or test.

## Model design

### User

- `id` (uuid), `email` (unique), `passwordHash`, `createdAt`, `updatedAt`.
- A user can be an author or a normal reader.

### Post

- `id` (uuid), `title`, `content`, `published` (default false), `authorId`, timestamps.
- A draft is still stored but is hidden from public reads.

### Comment

- `id` (uuid), `text`, optional `email`, `postId`, timestamps.
- A comment belongs to one post. Deleting the post deletes its comments.
- The email stays optional so readers can comment without an account.

## API contract

All error responses use `{ "message": string, "errors": object }`.
List responses use `{ "posts" | "comments": array, "pagination": object }`.
Query values are read with `matchedData(req)` after validation.

### Auth

| Method | Route                | Access    | Purpose                                    |
| ------ | -------------------- | --------- | ------------------------------------------ |
| POST   | `/api/auth/register` | Public    | Create an account and set the token cookie |
| POST   | `/api/auth/login`    | Public    | Check credentials and set the token cookie |
| POST   | `/api/auth/logout`   | Public    | Clear the token cookie                     |
| GET    | `/api/auth/me`       | Logged in | Read the current user                      |

### Posts

| Method | Route             | Access    | Purpose                                 |
| ------ | ----------------- | --------- | --------------------------------------- |
| GET    | `/api/posts`      | Public    | List published posts, newest first      |
| GET    | `/api/posts/mine` | Logged in | List the user's posts, including drafts |
| GET    | `/api/posts/:id`  | Public    | Read one published post                 |
| POST   | `/api/posts`      | Logged in | Create a post                           |
| PATCH  | `/api/posts/:id`  | Owner     | Update a post                           |
| DELETE | `/api/posts/:id`  | Owner     | Delete a post                           |

Rules for posts:

- Another user's draft returns 404 so it stays hidden.
- Another user's published post returns 403 on change or delete.
- Lists accept `?page=` and `?pageSize=`; the page size is capped at 100.

### Comments

| Method | Route                         | Access      | Purpose                           |
| ------ | ----------------------------- | ----------- | --------------------------------- |
| GET    | `/api/posts/:postId/comments` | Public      | List comments on a published post |
| POST   | `/api/posts/:postId/comments` | Public      | Add a comment to a published post |
| PATCH  | `/api/comments/:id`           | Post author | Edit a comment's text             |
| DELETE | `/api/comments/:id`           | Post author | Delete a comment                  |

Rules for comments:

- Only published posts accept public comments.
- `text` is required and limited in length.
- `email` is optional, but if present it must be a valid email.
- A comment on someone else's post does not give that reader edit rights. Only the post author can manage comments on that post.
- The comment list uses the same pagination shape as posts.

## Authentication decision

The Odin lesson asks for JWTs in an `Authorization: Bearer` header stored in localStorage.
This API currently uses an httpOnly cookie.

Recommendation: keep the cookie. JavaScript cannot read it, so a script cannot steal the token. The front-ends must send credentials with requests. This difference from the lesson is deliberate.

## Testing

- `tests/unit/` holds service and middleware tests.
- `tests/integration/` holds router tests using Supertest.
- All tests use the real `test_mydb` database through `TEST_DATABASE_URL`.
- Migrations run with `NODE_ENV=test` before tests, then the Prisma client is generated.
- Test files run one after another, and tables are reset between tests.
- The main risks to cover are draft leaks, ownership checks, validation errors, and route order.

## Build order

1. Add comment validation and service tests.
2. Add the comment service: create, list, update, delete, and ownership checks.
3. Add comment router integration tests.
4. Add the comment router and mount it in `src/app.ts`.
5. Update `README.md` with the new endpoints.
6. Build the two front-ends after the API is stable.

## Environment variables

- `DATABASE_URL`: local database connection string.
- `TEST_DATABASE_URL`: test database connection string.
- `JWT_SECRET`: secret used to sign tokens.
- `PORT`: server port, defaults to 3000.
- Cloudinary variables are listed in `.env.example` but are not used yet.
