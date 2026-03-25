import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('[auth] JWT_SECRET doit être défini dans les variables d\'environnement.')
}
const JWT_SECRET_STR = JWT_SECRET as string
const JWT_EXPIRES = '12h'

export function signToken(identifier: string): string {
  return jwt.sign({ identifier }, JWT_SECRET_STR, { expiresIn: JWT_EXPIRES })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié' })
    return
  }
  try {
    jwt.verify(header.slice(7), JWT_SECRET_STR)
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
