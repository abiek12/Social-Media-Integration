import { NextFunction } from "express";
import { Request, Response } from "express";

export const rawbodyParserMiddleware = (req: Request, res: Response, next: NextFunction) => {
    (req as any).rawBody = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      (req as any).rawBody += chunk;
    });
    next();
};