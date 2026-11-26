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

export const createPost = (authorId: string, { title, content, published }: PostInput) =>
  prisma.post.create({
    data: { title, content, published, authorId },
    select: postSelect,
  });

export const listPublishedPosts = () =>
  prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: postSelect,
  });

export const listPostsByAuthor = (authorId: string) =>
  prisma.post.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: postSelect,
  });

export const getPublishedPost = async (id: string) => {
  const post = await prisma.post.findUnique({ where: { id }, select: postSelect });

  // unpublished posts look like they don't exist
  if (!post || !post.published) throw new AppError(404, "Post not found");
  return post;
};

// 404 if missing, or if it's someone else's draft.
// 403 if it's someone else's published post.
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
    data: { title, content, published }, // undefined fields are ignored by Prisma
    select: postSelect,
  });
};

export const deletePost = async (id: string, userId: string) => {
  await assertOwner(id, userId);
  await prisma.post.delete({ where: { id } });
};
