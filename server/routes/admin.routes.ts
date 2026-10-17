import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware.js";
import {
  listUsers,
  setUserActive,
  createInvitation,
  listInvitations,
  revokeInvitation,
  createPasswordReset,
  getUserById,
  AuthError,
} from "../services/authService.js";
import {
  sendInvitationEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";

const router = Router();

// Todas las rutas de este router requieren rol Administrador
router.use(requireAdmin);

// GET /api/admin/users
router.get("/users", async (_req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al listar usuarios";
    res.status(500).json({ error: message });
  }
});

// POST /api/admin/users/:id/active
router.post("/users/:id/active", async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const targetUserId = Number(req.params.id);
    const { isActive } = req.body;
    const user = await setUserActive(targetUserId, Boolean(isActive), req.user.id);
    res.json({ success: true, user });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Error al actualizar estado del usuario";
    res.status(500).json({ error: message });
  }
});

// POST /api/admin/users/:id/reset-password
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const targetUserId = Number(req.params.id);
    const targetUser = await getUserById(targetUserId);
    const reset = await createPasswordReset(targetUserId, req.user.id);
    const origin = req.get("origin") || process.env.PUBLIC_URL || "https://epivox.pastenlabs.com";
    const resetUrl = `${origin}/reset-password?token=${reset.token}`;

    let emailSent = false;
    let emailError: string | undefined;

    if (targetUser?.email) {
      const emailResult = await sendPasswordResetEmail({
        to: targetUser.email,
        resetUrl,
        userName: targetUser.full_name || targetUser.username,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
    }

    res.json({
      success: true,
      token: reset.token,
      expiresAt: reset.expires_at,
      resetUrl,
      emailSent,
      emailError,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Error al generar reset";
    res.status(500).json({ error: message });
  }
});

// GET /api/admin/invitations
router.get("/invitations", async (_req, res) => {
  try {
    const invitations = await listInvitations();
    res.json(invitations);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al listar invitaciones";
    res.status(500).json({ error: message });
  }
});

// POST /api/admin/invitations
router.post("/invitations", async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const { email, role } = req.body;
    const invitation = await createInvitation(email, role, req.user.id);
    const origin = req.get("origin") || process.env.PUBLIC_URL || "https://epivox.pastenlabs.com";
    const inviteUrl = `${origin}/register?token=${invitation.token}`;

    const emailResult = await sendInvitationEmail({
      to: email,
      inviteUrl,
      role,
      invitedByName: req.user.full_name || req.user.username,
    });

    res.status(201).json({
      success: true,
      invitation,
      inviteUrl,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Error al crear invitación";
    res.status(500).json({ error: message });
  }
});

// DELETE /api/admin/invitations/:id
router.delete("/invitations/:id", async (req, res) => {
  try {
    await revokeInvitation(Number(req.params.id));
    res.json({ success: true, message: "Invitación revocada" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al revocar invitación";
    res.status(500).json({ error: message });
  }
});

export default router;
