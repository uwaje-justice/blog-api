import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { authCookie, createUser, prisma, resetDb } from "../helpers.js";

let ownerId: string;
let otherId: string;
let postId: string;

beforeEach(async () => {
  await resetDb();
  ownerId = (await createUser("owner@b.com")).id;
  otherId = (await createUser("other@b.com")).id;
  postId = (
    await prisma.post.create({
      data: { title: "Post", content: "Body", published: true, authorId: ownerId },
      select: { id: true },
    })
  ).id;
});
afterAll(() => prisma.$disconnect());

describe("GET /api/posts/:postId/comments", () => {
  it("returns comments with pagination", async () => {
    await prisma.comment.create({ data: { text: "Hello", postId } });

    const response = await request(app).get(`/api/posts/${postId}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments.map((comment: { text: string }) => comment.text)).toEqual([
      "Hello",
    ]);
    expect(response.body.pagination).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it("does not show comments on a draft", async () => {
    const draft = await prisma.post.create({
      data: { title: "Draft", content: "Body", published: false, authorId: ownerId },
      select: { id: true },
    });

    const response = await request(app).get(`/api/posts/${draft.id}/comments`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Post not found", errors: {} });
  });
});

describe("POST /api/posts/:postId/comments", () => {
  it("lets a visitor add a comment with an email", async () => {
    const response = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .send({ text: "Great post", email: "reader@example.com" });

    expect(response.status).toBe(201);
    expect(response.body.comment).toMatchObject({
      text: "Great post",
      email: "reader@example.com",
      postId,
    });
  });

  it("returns 400 when the text is missing", async () => {
    const response = await request(app).post(`/api/posts/${postId}/comments`).send({ text: "" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Validation failed",
      errors: { text: "Text must be 1 to 5000 characters" },
    });
  });

  it("does not allow comments on a draft", async () => {
    const draft = await prisma.post.create({
      data: { title: "Draft", content: "Body", published: false, authorId: ownerId },
      select: { id: true },
    });

    const response = await request(app)
      .post(`/api/posts/${draft.id}/comments`)
      .send({ text: "Hello" });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/comments/:id", () => {
  it("lets the post author edit a comment", async () => {
    const comment = await prisma.comment.create({ data: { text: "Hello", postId } });

    const response = await request(app)
      .patch(`/api/comments/${comment.id}`)
      .set("Cookie", authCookie(ownerId))
      .send({ text: "Edited" });

    expect(response.status).toBe(200);
    expect(response.body.comment.text).toBe("Edited");
  });

  it("returns 403 when another user edits a comment", async () => {
    const comment = await prisma.comment.create({ data: { text: "Hello", postId } });

    const response = await request(app)
      .patch(`/api/comments/${comment.id}`)
      .set("Cookie", authCookie(otherId))
      .send({ text: "Hacked" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You can only change comments on your own posts",
      errors: {},
    });
  });

  it("returns 401 without a cookie", async () => {
    const comment = await prisma.comment.create({ data: { text: "Hello", postId } });

    const response = await request(app)
      .patch(`/api/comments/${comment.id}`)
      .send({ text: "Edited" });

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/comments/:id", () => {
  it("lets the post author delete a comment", async () => {
    const comment = await prisma.comment.create({ data: { text: "Hello", postId } });

    const response = await request(app)
      .delete(`/api/comments/${comment.id}`)
      .set("Cookie", authCookie(ownerId));

    expect(response.status).toBe(204);
    expect(await prisma.comment.findUnique({ where: { id: comment.id } })).toBeNull();
  });

  it("returns 403 when another user deletes a comment", async () => {
    const comment = await prisma.comment.create({ data: { text: "Hello", postId } });

    const response = await request(app)
      .delete(`/api/comments/${comment.id}`)
      .set("Cookie", authCookie(otherId));

    expect(response.status).toBe(403);
  });
});
