import { Response } from 'express';
import { ApiResponse } from '@antigravite/types';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code?: string,
  details?: unknown
): Response {
  const payload: ApiResponse = {
    success: false,
    error: {
      message,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}
