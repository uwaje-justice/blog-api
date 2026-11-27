import type { Request, Response } from "express";
import { matchedData } from "express-validator";

import { getPagination, getUserId } from "../lib/index.js";
import { commentService } from "../services/index.js";

export const listComments = async (req: Request, res: Response) => {
  const { postId } = matchedData<{ postId: string }>(req, { locations: ["params"] });
  const result = await commentService.listCommentsByPost(postId, getPagination(req));
  return res.status(200).json(result);
};

export const createComment = async (req: Request, res: Response) => {
  const { postId } = matchedData<{ postId: string }>(req, { locations: ["params"] });
  const { text, email } = matchedData<{ text: string; email?: string }>(req, {
    locations: ["body"],
  });
  const comment = await commentService.createComment(postId, { text, email });
  return res.status(201).json({ comment });
};

export const updateComment = async (req: Request, res: Response) => {
  const { id } = matchedData<{ id: string }>(req, { locations: ["params"] });
  const { text } = matchedData<{ text: string }>(req, { locations: ["body"] });
  const comment = await commentService.updateComment(id, getUserId(req), { text });
  return res.status(200).json({ comment });
};

export const deleteComment = async (req: Request, res: Response) => {
  const { id } = matchedData<{ id: string }>(req, { locations: ["params"] });
  await commentService.deleteComment(id, getUserId(req));
  return res.status(204).send();
};
