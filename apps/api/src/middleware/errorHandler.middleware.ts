import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response.util.js';
import { MulterError } from 'multer';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error('[Unhandled Error]', err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['Field'];
      sendError(
        res,
        `A record with this ${target.join(', ')} already exists.`,
        409,
        'DUPLICATE_RESOURCE'
      );
      return;
    }

    if (err.code === 'P2025') {
      sendError(res, 'Requested resource was not found.', 404, 'NOT_FOUND');
      return;
    }
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File size exceeds 5MB limit.', 400, 'FILE_TOO_LARGE');
      return;
    }
    sendError(res, err.message, 400, 'UPLOAD_ERROR');
    return;
  }

  if (err instanceof Error) {
    sendError(res, err.message, 500, 'INTERNAL_SERVER_ERROR');
    return;
  }

  sendError(res, 'An unexpected server error occurred.', 500, 'INTERNAL_SERVER_ERROR');
}
