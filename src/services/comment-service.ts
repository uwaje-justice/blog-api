import { AppError } from "../errors/index.js";
import type { PaginationInput } from "../lib/index.js";
import { db as prisma, getPageValues, makePagination } from "../lib/index.js";

const commentSelect = {
  id: true,
  text: true,
  email: true,
  postId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CommentInput = { text: string; email?: string | null };

const getPublishedPost = async (postId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { published: true } });
  if (!post || !post.published) throw new AppError(404, "Post not found");
};

export const createComment = async (postId: string, { text, email }: CommentInput) => {
  await getPublishedPost(postId);
  return prisma.comment.create({
    data: { text, email: email ?? null, postId },
    select: commentSelect,
  });
};

export const listCommentsByPost = async (postId: string, pagination: PaginationInput = {}) => {
  await getPublishedPost(postId);
  const { page, pageSize, skip } = getPageValues(pagination);
  const [comments, totalItems] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize,
      select: commentSelect,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  return { comments, pagination: makePagination(page, pageSize, totalItems) };
};

const assertPostAuthor = async (id: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { post: { select: { authorId: true, published: true } } },
  });

  if (!comment) throw new AppError(404, "Comment not found");
  if (comment.post.authorId !== userId) {
    throw comment.post.published
      ? new AppError(403, "You can only change comments on your own posts")
      : new AppError(404, "Comment not found");
  }
};

export const updateComment = async (id: string, userId: string, { text }: { text: string }) => {
  await assertPostAuthor(id, userId);
  return prisma.comment.update({ where: { id }, data: { text }, select: commentSelect });
};

export const deleteComment = async (id: string, userId: string) => {
  await assertPostAuthor(id, userId);
  await prisma.comment.delete({ where: { id } });
};
