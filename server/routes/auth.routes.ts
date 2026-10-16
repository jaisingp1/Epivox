import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  signSession,
  getValidInvitation,
  registerWithInvitation,
  changeOwnPassword,
  resetPasswordWithToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  AuthError,
} from "../services/authService.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Rate limiter para proteger contra ataques de fuerza bruta en login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiados intentos fallidos. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { login: loginValue, password } = req.body;
    const user = await login(loginValue, password);
    const token = signSession(user.id);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
      path: "/",
    });

    res.json({
      success: true,
      user,
      token,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Error al iniciar sesión";
    res.status(500).json({ error: message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user,
  });
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ success: true, message: "Sesión cerrada" });
});

// GET /api/auth/invitation/:token
router.get("/invitation/:token", async (req, res) => {
  try {
    const invitation = await getValidInvitation(req.params.token);
    if (!invitation) {
      res.status(404).json({ error: "Invitación inválida, usada o expirada" });
      return;
    }
    res.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expires_at,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al validar invitación";
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { token, username, fullName, password } = req.body;
    const user = await registerWithInvitation({
      token,
      username,
      fullName,
      password,
    });

    const sessionToken = signSession(user.id);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
      path: "/",
    });

    res.status(201).json({
      success: true,
      user,
      token: sessionToken,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Error al registrarse";
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const { currentPassword, newPassword } = req.body;
    await changeOwnPassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, message: "Contraseña actualizada exitosamente" });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Error al cambiar contraseña";
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await resetPasswordWithToken(token, newPassword);
    res.json({ success: true, message: "Contraseña restablecida exitosamente" });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Error al restablecer contraseña";
    res.status(500).json({ error: message });
  }
});

export default router;
