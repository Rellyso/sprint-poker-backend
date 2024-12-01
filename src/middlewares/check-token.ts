import { NextFunction, Request, Response } from 'express'
import { getToken } from '../utils/get-token'
import { verifyToken } from '../utils/verify-token'

export function checkToken(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req)

  if (!token) {
    res.status(401).json({
      message: 'Acesso negado!'
    })
    return
  }

  try {
    verifyToken(token)
    next()
  } catch (err) {
    res.status(400).json({
      message: 'Token inválido!',
      err
    })
  }
}
