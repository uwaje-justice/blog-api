import type { Request, Response } from "express";
import { matchedData } from "express-validator";

import { getPagination, getUserId } from "../lib/index.js";
import { postService } from "../services/index.js";

const getPostId = (req: Request) => matchedData<{ id: string }>(req, { locations: ["params"] }).id;

export const createPost = async (req: Request, res: Response) => {
  const post = await postService.createPost(getUserId(req), req.body);
  return res.status(201).json({ post });
};

export const getPublishedPosts = async (req: Request, res: Response) => {
  const result = await postService.listPublishedPosts(getPagination(req));
  return res.status(200).json(result);
};

export const getMyPosts = async (req: Request, res: Response) => {
  const result = await postService.listPostsByAuthor(getUserId(req), getPagination(req));
  return res.status(200).json(result);
};

export const getPost = async (req: Request, res: Response) => {
  const post = await postService.getPublishedPost(getPostId(req));
  return res.status(200).json({ post });
};

export const updatePost = async (req: Request, res: Response) => {
  const post = await postService.updatePost(getPostId(req), getUserId(req), req.body);
  return res.status(200).json({ post });
};

export const deletePost = async (req: Request, res: Response) => {
  await postService.deletePost(getPostId(req), getUserId(req));
  return res.status(204).send();
};
