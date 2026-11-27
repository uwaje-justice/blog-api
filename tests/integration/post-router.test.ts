import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { authCookie, createUser, prisma, resetDb } from "../helpers.js";

let ownerId: string;
let otherId: string;

beforeEach(async () => {
  await resetDb();
  ownerId = (await createUser("owner@b.com")).id;
  otherId = (await createUser("other@b.com")).id;
});
afterAll(() => prisma.$disconnect());

const makePost = (authorId: string, overrides: Record<string, unknown> = {}) =>
  prisma.post.create({
    data: {
      title: "Hello",
      content: "World",
      published: true,
      authorId,
      ...overrides,
    },
  });

describe("GET /api/posts/mine", () => {
  it("returns the signed-in user's posts, including drafts, and not other users' posts", async () => {
    await makePost(ownerId, { title: "Mine" });
    await makePost(ownerId, { title: "My draft", published: false });
    await makePost(otherId, { title: "Theirs" });

    const response = await request(app).get("/api/posts/mine").set("Cookie", authCookie(ownerId));

    expect(response.status).toBe(200);
    expect(response.body.posts.map((post: { title: string }) => post.title)).toEqual([
      "My draft",
      "Mine",
    ]);
    expect(response.body.pagination.totalItems).toBe(2);
  });

  it("returns 401 without a cookie", async () => {
    const response = await request(app).get("/api/posts/mine");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized", errors: {} });
  });
});

describe("GET /api/posts", () => {
  it("returns published posts with pagination details", async () => {
    await makePost(ownerId, { title: "Published" });
    await makePost(ownerId, { title: "Draft", published: false });

    const response = await request(app).get("/api/posts");

    expect(response.status).toBe(200);
    expect(response.body.posts.map((post: { title: string }) => post.title)).toEqual(["Published"]);
    expect(response.body.pagination).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it("uses the requested page and page size", async () => {
    await makePost(ownerId, { title: "Old", createdAt: new Date("2026-01-01") });
    await makePost(ownerId, { title: "New", createdAt: new Date("2026-02-01") });

    const response = await request(app).get("/api/posts?page=2&pageSize=1");

    expect(response.status).toBe(200);
    expect(response.body.posts.map((post: { title: string }) => post.title)).toEqual(["Old"]);
    expect(response.body.pagination).toMatchObject({ page: 2, pageSize: 1, totalPages: 2 });
  });

  it("rejects an invalid page with the shared error shape", async () => {
    const response = await request(app).get("/api/posts?page=0");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Validation failed",
      errors: { page: "Page must be a positive integer" },
    });
  });
});

describe("POST /api/posts", () => {
  it("creates a post for the signed-in user", async () => {
    const response = await request(app)
      .post("/api/posts")
      .set("Cookie", authCookie(ownerId))
      .send({ title: "New post", content: "Body", published: true });

    expect(response.status).toBe(201);
    expect(response.body.post).toMatchObject({
      title: "New post",
      content: "Body",
      published: true,
      authorId: ownerId,
    });
  });

  it("returns 401 without a cookie", async () => {
    const response = await request(app)
      .post("/api/posts")
      .send({ title: "New post", content: "Body" });

    expect(response.status).toBe(401);
  });

  it("returns 400 for an empty title", async () => {
    const response = await request(app)
      .post("/api/posts")
      .set("Cookie", authCookie(ownerId))
      .send({ title: "", content: "Body" });

    expect(response.status).toBe(400);
    expect(response.body.errors.title).toBe("Title must be 1 to 150 characters");
  });
});

describe("GET /api/posts/:id", () => {
  it("returns a published post", async () => {
    const post = await makePost(ownerId);

    const response = await request(app).get(`/api/posts/${post.id}`);

    expect(response.status).toBe(200);
    expect(response.body.post.id).toBe(post.id);
  });

  it("does not reveal a draft", async () => {
    const draft = await makePost(ownerId, { published: false });

    const response = await request(app).get(`/api/posts/${draft.id}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Post not found", errors: {} });
  });
});

describe("PATCH /api/posts/:id", () => {
  it("lets the owner update their post", async () => {
    const post = await makePost(ownerId);

    const response = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set("Cookie", authCookie(ownerId))
      .send({ title: "Updated" });

    expect(response.status).toBe(200);
    expect(response.body.post.title).toBe("Updated");
  });

  it("returns 403 when editing another user's published post", async () => {
    const post = await makePost(otherId);

    const response = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set("Cookie", authCookie(ownerId))
      .send({ title: "Hacked" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You can only change your own posts",
      errors: {},
    });
  });

  it("returns 404 when editing another user's draft", async () => {
    const draft = await makePost(otherId, { published: false });

    const response = await request(app)
      .patch(`/api/posts/${draft.id}`)
      .set("Cookie", authCookie(ownerId))
      .send({ title: "Hacked" });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/posts/:id", () => {
  it("lets the owner delete their post", async () => {
    const post = await makePost(ownerId);

    const response = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set("Cookie", authCookie(ownerId));

    expect(response.status).toBe(204);
    expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
  });

  it("returns 403 when deleting another user's post", async () => {
    const post = await makePost(otherId);

    const response = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set("Cookie", authCookie(ownerId));

    expect(response.status).toBe(403);
  });
});

describe("unknown routes", () => {
  it("returns 404 with the shared error shape", async () => {
    const response = await request(app).get("/no-such-route");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Route not found", errors: {} });
  });
});
