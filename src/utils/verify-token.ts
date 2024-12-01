import { verify } from 'jsonwebtoken'
import { SessionToken } from '../models/types/token'

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET!

  return verify(token, secret) as SessionToken
}
