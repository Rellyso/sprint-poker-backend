import { verify } from "jsonwebtoken";

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET!;

  return verify(token, secret);
}
