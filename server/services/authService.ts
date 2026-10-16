import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/db.js";

export type UserRole = "admin" | "creator";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

interface UserRow extends AuthUser {
  password_hash: string;
}

export interface Invitation {
  id: number;
  email: string;
  token: string;
  role: UserRole;
  invited_by_user_id: number;
  invited_by_username?: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const SESSION_COOKIE = "epivox_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const USER_COLUMNS =
  "id, username, email, full_name, role, is_active, created_at";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET es obligatorio en producción");
  }
  return "epivox-dev-only-secret";
}

function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

async function nextId(table: string): Promise<number> {
  const rows = await query<{ next_id: number }>(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${table}`,
  );
  return rows[0]?.next_id || 1;
}

function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      400,
    );
  }
  return password;
}

function normalizeEmail(email: unknown): string {
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(value)) {
    throw new AuthError("Correo electrónico inválido", 400);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Sesión (JWT en cookie HttpOnly)
// ---------------------------------------------------------------------------
export function signSession(userId: number): string {
  return jwt.sign({ sub: String(userId) }, getJwtSecret(), {
    expiresIn: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
}

export async function getUserFromToken(
  token: string | undefined,
): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== "object" || !payload.sub) return null;
    const user = await getUserById(Number(payload.sub));
    return user && user.is_active ? user : null;
  } catch {
    return null;
  }
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const rows = await query<AuthUser>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function findActiveUserByLogin(
  login: string,
): Promise<AuthUser | null> {
  const value = login.trim().toLowerCase();
  const rows = await query<AuthUser>(
    `SELECT ${USER_COLUMNS} FROM users
     WHERE (username = ? OR email = ?) AND is_active = TRUE`,
    [value, value],
  );
  return rows[0] || null;
}

export async function login(
  loginValue: unknown,
  password: unknown,
): Promise<AuthUser> {
  if (typeof loginValue !== "string" || typeof password !== "string") {
    throw new AuthError("Usuario y contraseña son obligatorios", 400);
  }
  const value = loginValue.trim().toLowerCase();
  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS}, password_hash FROM users
     WHERE username = ? OR email = ?`,
    [value, value],
  );
  const row = rows[0];
  const valid = row ? await bcrypt.compare(password, row.password_hash) : false;
  if (!row || !valid || !row.is_active) {
    throw new AuthError("Credenciales inválidas", 401);
  }
  const { password_hash: _omit, ...user } = row;
  return user;
}

export async function changeOwnPassword(
  userId: number,
  currentPassword: unknown,
  newPassword: unknown,
): Promise<void> {
  const rows = await query<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = ?`,
    [userId],
  );
  const valid =
    rows[0] && typeof currentPassword === "string"
      ? await bcrypt.compare(currentPassword, rows[0].password_hash)
      : false;
  if (!valid) throw new AuthError("La contraseña actual no es correcta", 400);
  const hash = await bcrypt.hash(validatePassword(newPassword), 10);
  await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [
    hash,
    userId,
  ]);
}

// ---------------------------------------------------------------------------
// Invitaciones (solo admin) y registro
// ---------------------------------------------------------------------------
export async function createInvitation(
  emailInput: unknown,
  roleInput: unknown,
  invitedByUserId: number,
): Promise<Invitation> {
  const email = normalizeEmail(emailInput);
  const role: UserRole = roleInput === "admin" ? "admin" : "creator";

  const existing = await query(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing.length > 0) {
    throw new AuthError("Ya existe un usuario con ese correo", 409);
  }

  const id = await nextId("invitations");
  await query(
    `INSERT INTO invitations (id, email, token, role, invited_by_user_id, expires_at)
     VALUES (?, ?, ?, ?, ?, CAST(CURRENT_TIMESTAMP AS TIMESTAMP) + INTERVAL 7 DAY)`,
    [id, email, newToken(), role, invitedByUserId],
  );
  const rows = await query<Invitation>(
    `SELECT * FROM invitations WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function listInvitations(): Promise<Invitation[]> {
  return query<Invitation>(
    `SELECT i.*, u.username AS invited_by_username
     FROM invitations i
     JOIN users u ON u.id = i.invited_by_user_id
     ORDER BY i.created_at DESC`,
  );
}

export async function revokeInvitation(id: number): Promise<void> {
  await query(
    `UPDATE invitations SET revoked_at = CAST(CURRENT_TIMESTAMP AS TIMESTAMP)
     WHERE id = ? AND used_at IS NULL AND revoked_at IS NULL`,
    [id],
  );
}

export async function getValidInvitation(
  token: string,
): Promise<Invitation | null> {
  const rows = await query<Invitation>(
    `SELECT * FROM invitations
     WHERE token = ? AND used_at IS NULL AND revoked_at IS NULL
       AND expires_at > CAST(CURRENT_TIMESTAMP AS TIMESTAMP)`,
    [token],
  );
  return rows[0] || null;
}

export async function registerWithInvitation(input: {
  token: unknown;
  username: unknown;
  fullName: unknown;
  password: unknown;
}): Promise<AuthUser> {
  const token = typeof input.token === "string" ? input.token : "";
  const username =
    typeof input.username === "string"
      ? input.username.trim().toLowerCase()
      : "";
  const fullName =
    typeof input.fullName === "string" ? input.fullName.trim() : "";
  if (!USERNAME_PATTERN.test(username)) {
    throw new AuthError(
      "Usuario inválido: 3-32 caracteres (minúsculas, números, punto, guion)",
      400,
    );
  }
  if (!fullName) throw new AuthError("El nombre completo es obligatorio", 400);
  const password = validatePassword(input.password);

  const invitation = await getValidInvitation(token);
  if (!invitation) {
    throw new AuthError("Invitación inválida, usada o expirada", 410);
  }
  const taken = await query(
    `SELECT id FROM users WHERE username = ? OR email = ?`,
    [username, invitation.email],
  );
  if (taken.length > 0) {
    throw new AuthError("El usuario o correo ya está registrado", 409);
  }

  // Consumir la invitación de forma condicional evita el doble uso concurrente.
  const claimed = await query<{ id: number }>(
    `UPDATE invitations SET used_at = CAST(CURRENT_TIMESTAMP AS TIMESTAMP)
     WHERE id = ? AND used_at IS NULL RETURNING id`,
    [invitation.id],
  );
  if (claimed.length === 0) {
    throw new AuthError("Invitación inválida, usada o expirada", 410);
  }

  try {
    const id = await nextId("users");
    const hash = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (id, username, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, username, invitation.email, hash, fullName, invitation.role],
    );
    const user = await getUserById(id);
    if (!user) throw new Error("No se pudo crear el usuario");
    return user;
  } catch (err) {
    await query(`UPDATE invitations SET used_at = NULL WHERE id = ?`, [
      invitation.id,
    ]);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Administración de usuarios y restablecimiento de contraseña por enlace
// ---------------------------------------------------------------------------
export async function listUsers(): Promise<AuthUser[]> {
  return query<AuthUser>(
    `SELECT ${USER_COLUMNS} FROM users ORDER BY created_at ASC`,
  );
}

export async function setUserActive(
  targetUserId: number,
  isActive: boolean,
  actingUserId: number,
): Promise<AuthUser> {
  if (targetUserId === actingUserId) {
    throw new AuthError("No puedes desactivar tu propia cuenta", 400);
  }
  await query(`UPDATE users SET is_active = ? WHERE id = ?`, [
    isActive,
    targetUserId,
  ]);
  const user = await getUserById(targetUserId);
  if (!user) throw new AuthError("Usuario no encontrado", 404);
  return user;
}

export async function createPasswordReset(
  targetUserId: number,
  actingUserId: number,
): Promise<{ token: string; expires_at: string }> {
  const user = await getUserById(targetUserId);
  if (!user) throw new AuthError("Usuario no encontrado", 404);
  const id = await nextId("password_resets");
  const token = newToken();
  await query(
    `INSERT INTO password_resets (id, user_id, token, created_by_user_id, expires_at)
     VALUES (?, ?, ?, ?, CAST(CURRENT_TIMESTAMP AS TIMESTAMP) + INTERVAL 24 HOUR)`,
    [id, targetUserId, token, actingUserId],
  );
  const rows = await query<{ token: string; expires_at: string }>(
    `SELECT token, expires_at FROM password_resets WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function resetPasswordWithToken(
  token: unknown,
  newPassword: unknown,
): Promise<void> {
  const password = validatePassword(newPassword);
  const claimed = await query<{ user_id: number }>(
    `UPDATE password_resets SET used_at = CAST(CURRENT_TIMESTAMP AS TIMESTAMP)
     WHERE token = ? AND used_at IS NULL
       AND expires_at > CAST(CURRENT_TIMESTAMP AS TIMESTAMP)
     RETURNING user_id`,
    [typeof token === "string" ? token : ""],
  );
  if (claimed.length === 0) {
    throw new AuthError("Enlace inválido, usado o expirado", 410);
  }
  const hash = await bcrypt.hash(password, 10);
  await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [
    hash,
    claimed[0].user_id,
  ]);
}
