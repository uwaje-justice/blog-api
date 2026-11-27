import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { AppError } from "../../src/errors/index.js";
import { postService } from "../../src/services/index.js";
import { createUser, prisma, resetDb } from "../helpers.js";

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

describe("createPost", () => {
  it("creates the post with the signed-in author", async () => {
    const post = await postService.createPost(ownerId, {
      title: "Hello",
      content: "World",
      published: true,
    });

    expect(post).toMatchObject({ title: "Hello", content: "World", authorId: ownerId });
  });

  it("ignores extra fields from the request body", async () => {
    const post = await postService.createPost(ownerId, {
      title: "Hello",
      content: "World",
      id: "forced-id",
      authorId: otherId,
    } as never);

    expect(post.id).not.toBe("forced-id");
    expect(post.authorId).toBe(ownerId);
  });
});

describe("listPublishedPosts", () => {
  it("returns only published posts, newest first, with pagination details", async () => {
    await makePost(ownerId, { title: "Old", createdAt: new Date("2026-01-01") });
    await makePost(ownerId, { title: "New", createdAt: new Date("2026-02-01") });
    await makePost(ownerId, { title: "Draft", published: false });

    const result = await postService.listPublishedPosts({ page: 1, pageSize: 1 });

    expect(result.posts.map((post) => post.title)).toEqual(["New"]);
    expect(result.pagination).toEqual({ page: 1, pageSize: 1, totalItems: 2, totalPages: 2 });
  });

  it("uses page 1 and size 20 when no pagination is given", async () => {
    await makePost(ownerId);

    const result = await postService.listPublishedPosts();

    expect(result.pagination).toMatchObject({ page: 1, pageSize: 20 });
  });
});

describe("listPostsByAuthor", () => {
  it("returns drafts for that author only, newest first", async () => {
    await makePost(ownerId, { title: "Mine", published: false });
    await makePost(otherId, { title: "Theirs" });

    const result = await postService.listPostsByAuthor(ownerId);

    expect(result.posts.map((post) => post.title)).toEqual(["Mine"]);
    expect(result.pagination.totalItems).toBe(1);
  });
});

describe("getPublishedPost", () => {
  it("returns a published post", async () => {
    const created = await makePost(ownerId);

    expect(await postService.getPublishedPost(created.id)).toMatchObject({ id: created.id });
  });

  it("throws 404 when the post does not exist", async () => {
    await expect(postService.getPublishedPost("missing")).rejects.toBeInstanceOf(AppError);
  });

  it("throws 404 for an unpublished post", async () => {
    const draft = await makePost(ownerId, { published: false });

    await expect(postService.getPublishedPost(draft.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("updatePost", () => {
  it("lets the owner update their post", async () => {
    const post = await makePost(ownerId);

    const updated = await postService.updatePost(post.id, ownerId, { title: "New" });

    expect(updated.title).toBe("New");
  });

  it("lets the owner publish a draft", async () => {
    const draft = await makePost(ownerId, { published: false });

    const updated = await postService.updatePost(draft.id, ownerId, { published: true });

    expect(updated.published).toBe(true);
  });

  it("throws 403 when editing someone else's published post", async () => {
    const post = await makePost(otherId);

    await expect(
      postService.updatePost(post.id, ownerId, { title: "Hacked" }),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("throws 404 when editing someone else's draft", async () => {
    const draft = await makePost(otherId, { published: false });

    await expect(
      postService.updatePost(draft.id, ownerId, { title: "Hacked" }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("deletePost", () => {
  it("lets the owner delete their post", async () => {
    const post = await makePost(ownerId);

    await postService.deletePost(post.id, ownerId);

    expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
  });

  it("throws 403 when deleting someone else's published post", async () => {
    const post = await makePost(otherId);

    await expect(postService.deletePost(post.id, ownerId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("throws 404 when deleting someone else's draft", async () => {
    const draft = await makePost(otherId, { published: false });

    await expect(postService.deletePost(draft.id, ownerId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
