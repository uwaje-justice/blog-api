import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { commentService } from "../../src/services/index.js";
import { createComment, createUser, prisma, resetDb } from "../helpers.js";

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

describe("createComment", () => {
  it("adds a comment to a published post", async () => {
    const comment = await commentService.createComment(postId, {
      text: "Nice post",
      email: "reader@example.com",
    });

    expect(comment).toMatchObject({
      text: "Nice post",
      email: "reader@example.com",
      postId,
    });
  });

  it("does not add a comment to a draft post", async () => {
    const draft = await prisma.post.create({
      data: { title: "Draft", content: "Body", published: false, authorId: ownerId },
      select: { id: true },
    });

    await expect(commentService.createComment(draft.id, { text: "Hello" })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("listCommentsByPost", () => {
  it("returns comments for that post, oldest first, with pagination", async () => {
    await createComment(postId, { text: "First", createdAt: new Date("2026-01-01") });
    await createComment(postId, { text: "Second", createdAt: new Date("2026-02-01") });

    const result = await commentService.listCommentsByPost(postId, { page: 2, pageSize: 1 });

    expect(result.comments.map((comment) => comment.text)).toEqual(["Second"]);
    expect(result.pagination).toEqual({ page: 2, pageSize: 1, totalItems: 2, totalPages: 2 });
  });

  it("does not show comments on a draft", async () => {
    const draft = await prisma.post.create({
      data: { title: "Draft", content: "Body", published: false, authorId: ownerId },
      select: { id: true },
    });

    await expect(commentService.listCommentsByPost(draft.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("updateComment", () => {
  it("lets the post author edit a comment", async () => {
    const comment = await createComment(postId);

    const updated = await commentService.updateComment(comment.id, ownerId, { text: "Edited" });

    expect(updated.text).toBe("Edited");
  });

  it("returns 403 when another user edits a comment on a published post", async () => {
    const comment = await createComment(postId);

    await expect(
      commentService.updateComment(comment.id, otherId, { text: "Hacked" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("returns 404 when another user edits a comment on a draft", async () => {
    const draft = await prisma.post.create({
      data: { title: "Draft", content: "Body", published: false, authorId: ownerId },
      select: { id: true },
    });
    const comment = await createComment(draft.id);

    await expect(
      commentService.updateComment(comment.id, otherId, { text: "Hacked" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("deleteComment", () => {
  it("lets the post author delete a comment", async () => {
    const comment = await createComment(postId);

    await commentService.deleteComment(comment.id, ownerId);

    expect(await prisma.comment.findUnique({ where: { id: comment.id } })).toBeNull();
  });

  it("returns 403 when another user deletes a comment", async () => {
    const comment = await createComment(postId);

    await expect(commentService.deleteComment(comment.id, otherId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
