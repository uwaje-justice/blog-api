import { AppError } from "../errors/index.js";
import prisma from "../lib/db.js";

const postSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PostInput = { title: string; content: string; published?: boolean };
type PaginationInput = { page?: number; pageSize?: number };
type PostFilter = { published?: boolean; authorId?: string };

const DEFAULT_PAGE_SIZE = 20;

const listPosts = async (
  where: PostFilter,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE }: PaginationInput = {},
) => {
  const [posts, totalItems] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: postSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
};

export const createPost = (authorId: string, { title, content, published }: PostInput) =>
  prisma.post.create({
    data: { title, content, published, authorId },
    select: postSelect,
  });

export const listPublishedPosts = (pagination: PaginationInput = {}) =>
  listPosts({ published: true }, pagination);

export const listPostsByAuthor = (authorId: string, pagination: PaginationInput = {}) =>
  listPosts({ authorId }, pagination);

export const getPublishedPost = async (id: string) => {
  const post = await prisma.post.findUnique({ where: { id }, select: postSelect });

  if (!post || !post.published) throw new AppError(404, "Post not found");
  return post;
};

const assertOwner = async (id: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id }, select: postSelect });

  if (!post) throw new AppError(404, "Post not found");
  if (post.authorId !== userId) {
    throw post.published
      ? new AppError(403, "You can only change your own posts")
      : new AppError(404, "Post not found");
  }
};

export const updatePost = async (
  id: string,
  userId: string,
  { title, content, published }: Partial<PostInput>,
) => {
  await assertOwner(id, userId);
  return prisma.post.update({
    where: { id },
    data: { title, content, published },
    select: postSelect,
  });
};

export const deletePost = async (id: string, userId: string) => {
  await assertOwner(id, userId);
  await prisma.post.delete({ where: { id } });
};
