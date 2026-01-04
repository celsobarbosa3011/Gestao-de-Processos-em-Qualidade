import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "mediflow-dev-secret-change-in-production";
const JWT_EXPIRY = "24h";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticação necessário" });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  
  req.auth = payload;
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Token de autenticação necessário" });
  }
  
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  
  next();
}
