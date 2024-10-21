import { NextFunction, Request, Response } from "express";

export function checkToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      message: 'Acesso negado!'
    })
  } else {
    next();
  }

}