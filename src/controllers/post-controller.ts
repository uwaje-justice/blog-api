import type { Request, Response } from "express";

import { AppError } from "../errors/index.js";
import { postService } from "../services/index.js";

const getUserId = (req: Request) => {
  if (!req.user) throw new AppError(401, "Unauthorized");
  return req.user.id;
};

export const createPost = async (req: Request, res: Response) => {
  const post = await postService.createPost(getUserId(req), req.body);
  return res.status(201).json({ post });
};

export const getPublishedPosts = async (_req: Request, res: Response) => {
  const posts = await postService.listPublishedPosts();
  return res.status(200).json({ posts });
};

export const getMyPosts = async (req: Request, res: Response) => {
  const posts = await postService.listPostsByAuthor(getUserId(req));
  return res.status(200).json({ posts });
};

export const getPost = async (req: Request, res: Response) => {
  const post = await postService.getPublishedPost(req.params.id);
  return res.status(200).json({ post });
};

export const updatePost = async (req: Request, res: Response) => {
  const post = await postService.updatePost(req.params.id, getUserId(req), req.body);
  return res.status(200).json({ post });
};

export const deletePost = async (req: Request, res: Response) => {
  await postService.deletePost(req.params.id, getUserId(req));
  return res.status(204).send();
};
