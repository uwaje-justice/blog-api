import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../errors/index.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    post: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("../lib/db.js", () => ({ default: prismaMock }));

import * as postService from "./post-service.js";

const OWNER = "user-1";
const OTHER = "user-2";

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: "post-1",
  title: "Hello",
  content: "World",
  published: true,
  authorId: OWNER,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createPost", () => {
  it("creates the post with the given author", async () => {
    prismaMock.post.create.mockResolvedValue(makePost());

    const post = await postService.createPost(OWNER, {
      title: "Hello",
      content: "World",
      published: true,
    });

    expect(prismaMock.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: "Hello", content: "World", published: true, authorId: OWNER },
      }),
    );
    expect(post).toEqual(makePost());
  });

  it("ignores extra fields like id and authorId from the request body", async () => {
    prismaMock.post.create.mockResolvedValue(makePost());

    await postService.createPost(OWNER, {
      title: "Hello",
      content: "World",
      id: "forced-id",
      authorId: "someone-else",
    } as never);

    const { data } = prismaMock.post.create.mock.calls[0][0];
    expect(data.authorId).toBe(OWNER);
    expect(data).not.toHaveProperty("id");
  });
});

describe("listPublishedPosts", () => {
  it("only asks for published posts, newest first", async () => {
    prismaMock.post.findMany.mockResolvedValue([makePost()]);

    const posts = await postService.listPublishedPosts();

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(posts).toHaveLength(1);
  });
});

describe("listPostsByAuthor", () => {
  it("returns posts for that author only, drafts included", async () => {
    prismaMock.post.findMany.mockResolvedValue([makePost({ published: false })]);

    await postService.listPostsByAuthor(OWNER);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: OWNER },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});

describe("getPublishedPost", () => {
  it("returns a published post", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost());

    const post = await postService.getPublishedPost("post-1");

    expect(post).toEqual(makePost());
  });

  it("throws 404 when the post does not exist", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    const promise = postService.getPublishedPost("missing");

    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 for an unpublished post, so drafts are not leaked", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost({ published: false }));

    await expect(postService.getPublishedPost("post-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("updatePost", () => {
  it("lets the owner update their post", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost());
    prismaMock.post.update.mockResolvedValue(makePost({ title: "New" }));

    const post = await postService.updatePost("post-1", OWNER, { title: "New" });

    expect(prismaMock.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post-1" },
        data: { title: "New", content: undefined, published: undefined },
      }),
    );
    expect(post.title).toBe("New");
  });

  it("lets the owner publish a draft", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost({ published: false }));
    prismaMock.post.update.mockResolvedValue(makePost({ published: true }));

    await postService.updatePost("post-1", OWNER, { published: true });

    expect(prismaMock.post.update).toHaveBeenCalledOnce();
  });

  it("throws 404 when the post does not exist", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    await expect(postService.updatePost("missing", OWNER, { title: "New" })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prismaMock.post.update).not.toHaveBeenCalled();
  });

  it("throws 403 when editing someone else's published post", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost({ authorId: OTHER }));

    await expect(
      postService.updatePost("post-1", OWNER, { title: "Hacked" }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.post.update).not.toHaveBeenCalled();
  });

  it("throws 404 when editing someone else's draft, so it is not revealed", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost({ authorId: OTHER, published: false }));

    await expect(
      postService.updatePost("post-1", OWNER, { title: "Hacked" }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.post.update).not.toHaveBeenCalled();
  });
});

describe("deletePost", () => {
  it("lets the owner delete their post", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost());
    prismaMock.post.delete.mockResolvedValue(makePost());

    await postService.deletePost("post-1", OWNER);

    expect(prismaMock.post.delete).toHaveBeenCalledWith({ where: { id: "post-1" } });
  });

  it("throws 404 when the post does not exist", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    await expect(postService.deletePost("missing", OWNER)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prismaMock.post.delete).not.toHaveBeenCalled();
  });

  it("throws 403 when deleting someone else's published post", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost({ authorId: OTHER }));

    await expect(postService.deletePost("post-1", OWNER)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(prismaMock.post.delete).not.toHaveBeenCalled();
  });

  it("throws 404 when deleting someone else's draft", async () => {
    prismaMock.post.findUnique.mockResolvedValue(makePost({ authorId: OTHER, published: false }));

    await expect(postService.deletePost("post-1", OWNER)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prismaMock.post.delete).not.toHaveBeenCalled();
  });
});
