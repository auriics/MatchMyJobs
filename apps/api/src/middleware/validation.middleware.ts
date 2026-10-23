import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.util.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', issues);
        return;
      }
      sendError(res, 'Invalid request payload', 400, 'BAD_REQUEST');
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = (await schema.parseAsync(req.params)) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 'Invalid route parameters', 400, 'PARAMS_VALIDATION_ERROR', error.issues);
        return;
      }
      sendError(res, 'Invalid parameters', 400, 'BAD_REQUEST');
    }
  };
}
