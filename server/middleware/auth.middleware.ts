import type { Request, Response, NextFunction } from "express";
import {
  getUserFromToken,
  SESSION_COOKIE,
  type AuthUser,
} from "../services/authService.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | undefined {
  if (req.cookies && req.cookies[SESSION_COOKIE]) {
    return req.cookies[SESSION_COOKIE];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return undefined;
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Continuar sin usuario
  }
  next();
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Sesión no iniciada" });
      return;
    }
    const user = await getUserFromToken(token);
    if (!user) {
      res.status(401).json({ error: "Sesión expirada o inválida" });
      return;
    }
    req.user = user;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de autenticación";
    res.status(401).json({ error: message });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Acceso denegado: se requiere rol Administrador" });
      return;
    }
    next();
  });
}
