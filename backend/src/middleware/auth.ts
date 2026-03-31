import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';
import { config } from '../config';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  if (config.useMock) {
    // No modo mock, qualquer token é aceito
    req.user = { userId: 1, email: 'demo@fortemedia.com' };
    return next();
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
