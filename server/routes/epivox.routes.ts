import { Router } from "express";
import {
  getActivities,
  getTemplates,
  getActivityById,
  getQuestionsByActivityId,
  createActivity,
  updateActivity,
  deleteActivity,
  cloneActivity,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  getActivityAccess,
  canEditActivity,
  canManageActivity,
  listCollaborators,
  addCollaborator,
  removeCollaborator,
  getQuestionActivityId,
} from "../services/activityService.js";
import {
  createSession,
  getAllSessions,
  getSessionByPin,
  getLeaderboard,
  getParticipants,
  getSessionReport,
  getHubGlobalStats,
  cancelSession,
} from "../services/sessionService.js";
import { broadcastSessionCancelled } from "../services/socketManager.js";
import { findActiveUserByLogin, listUsers } from "../services/authService.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getBankQuestions,
  createBankQuestion,
  updateBankQuestion,
  deleteBankQuestion,
  importExcelToFolder,
  copyBankQuestionsToActivity,
} from "../services/questionBankService.js";

const router = Router();


// ---------------------------------------------------------------------------
// Métricas Globales del Hub
// ---------------------------------------------------------------------------
router.get("/hub/stats", requireAuth, async (_req, res) => {
  try {
    const stats = await getHubGlobalStats();
    res.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener métricas";
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Actividades & Plantillas
// ---------------------------------------------------------------------------

// Listar presentaciones propias y colaborativas (admin ve todas)
router.get("/activities", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const list = await getActivities(req.user);
    res.json(list);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Banco de plantillas (públicas)
router.get("/templates", optionalAuth, async (_req, res) => {
  try {
    const templates = await getTemplates();
    res.json(templates);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Detalle de actividad con sus diapositivas
router.get("/activities/:id", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!access) {
      res.status(403).json({ error: "No tienes permiso para ver esta presentación" });
      return;
    }

    const item = await getActivityById(activityId);
    if (!item) {
      res.status(404).json({ error: "Actividad no encontrada" });
      return;
    }
    const questions = await getQuestionsByActivityId(item.id);
    res.json({ ...item, my_access: access, questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Crear nueva actividad (el creador queda como dueño)
router.post("/activities", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const created = await createActivity(req.body, req.user.id);
    res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Actualizar actividad (dueño, admin o colaborador editor)
router.put("/activities/:id", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!canEditActivity(access)) {
      res.status(403).json({ error: "No tienes permiso para editar esta presentación" });
      return;
    }

    const updated = await updateActivity(activityId, req.body);
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Eliminar actividad (solo dueño o admin)
router.delete("/activities/:id", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!canManageActivity(access)) {
      res.status(403).json({ error: "Solo el propietario o administrador puede eliminar esta presentación" });
      return;
    }

    await deleteActivity(activityId);
    res.json({ success: true, message: "Actividad eliminada" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Duplicar actividad
router.post("/activities/:id/clone", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!access) {
      res.status(403).json({ error: "No tienes permiso para duplicar esta presentación" });
      return;
    }

    const cloned = await cloneActivity(activityId, req.user.id);
    res.status(201).json(cloned);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Colaboradores de una presentación
// ---------------------------------------------------------------------------

router.get("/activities/:id/collaborators", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!access) {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }

    const collaborators = await listCollaborators(activityId);
    res.json(collaborators);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.post("/activities/:id/collaborators", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!canManageActivity(access)) {
      res.status(403).json({ error: "Solo el propietario o administrador puede agregar colaboradores" });
      return;
    }

    const { usernameOrEmail } = req.body;
    if (typeof usernameOrEmail !== "string" || !usernameOrEmail.trim()) {
      res.status(400).json({ error: "El usuario o correo es obligatorio" });
      return;
    }

    const targetUser = await findActiveUserByLogin(usernameOrEmail);
    if (!targetUser) {
      res.status(404).json({ error: "Usuario no encontrado o inactivo" });
      return;
    }

    const activity = await getActivityById(activityId);
    if (activity && activity.created_by_user_id === targetUser.id) {
      res.status(400).json({ error: "El usuario ya es el propietario de esta presentación" });
      return;
    }

    await addCollaborator(activityId, targetUser.id);
    const updated = await listCollaborators(activityId);
    res.status(201).json({ success: true, collaborators: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al agregar colaborador";
    res.status(500).json({ error: message });
  }
});

router.delete("/activities/:id/collaborators/:userId", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    const targetUserId = Number(req.params.userId);

    // El dueño, el admin, o el propio colaborador pueden remover el acceso
    const isSelfRemoval = req.user.id === targetUserId;
    if (!canManageActivity(access) && !isSelfRemoval) {
      res.status(403).json({ error: "No tienes permiso para remover este colaborador" });
      return;
    }

    await removeCollaborator(activityId, targetUserId);
    res.json({ success: true, message: "Colaborador removido" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al remover colaborador";
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Preguntas / Diapositivas
// ---------------------------------------------------------------------------

router.post("/activities/:id/questions", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!canEditActivity(access)) {
      res.status(403).json({ error: "No tienes permiso para editar esta presentación" });
      return;
    }

    const created = await createQuestion({
      ...req.body,
      activity_id: activityId,
    });
    res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.put("/questions/:id", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const questionId = Number(req.params.id);
    const activityId = await getQuestionActivityId(questionId);
    if (!activityId) {
      res.status(404).json({ error: "Pregunta no encontrada" });
      return;
    }
    const access = await getActivityAccess(req.user, activityId);
    if (!canEditActivity(access)) {
      res.status(403).json({ error: "No tienes permiso para editar esta presentación" });
      return;
    }

    const updated = await updateQuestion(questionId, req.body);
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.delete("/questions/:id", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const questionId = Number(req.params.id);
    const activityId = await getQuestionActivityId(questionId);
    if (!activityId) {
      res.status(404).json({ error: "Pregunta no encontrada" });
      return;
    }
    const access = await getActivityAccess(req.user, activityId);
    if (!canEditActivity(access)) {
      res.status(403).json({ error: "No tienes permiso para editar esta presentación" });
      return;
    }

    await deleteQuestion(questionId);
    res.json({ success: true, message: "Pregunta eliminada" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.put("/activities/:id/reorder", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const activityId = Number(req.params.id);
    const access = await getActivityAccess(req.user, activityId);
    if (!canEditActivity(access)) {
      res.status(403).json({ error: "No tienes permiso para editar esta presentación" });
      return;
    }

    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      res.status(400).json({ error: "questionIds debe ser un arreglo de IDs" });
      return;
    }
    await reorderQuestions(activityId, questionIds);
    res.json({ success: true, message: "Orden de preguntas actualizado" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Sesiones en Vivo & Reportes
// ---------------------------------------------------------------------------

router.get("/sessions", requireAuth, async (_req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json(sessions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.post("/sessions/create", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const { activityId, mode, anonymous, maxParticipants } = req.body;
    const actId = Number(activityId || 1);
    const access = await getActivityAccess(req.user, actId);
    if (!access) {
      res.status(403).json({ error: "No tienes permiso para presentar esta actividad" });
      return;
    }

    const session = await createSession(actId, req.user.id, {
      mode,
      anonymous,
      maxParticipants,
    });
    res.status(201).json(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Consulta de sesión por PIN (pública para móviles y pantalla)
router.get("/sessions/:pin", async (req, res) => {
  try {
    const session = await getSessionByPin(req.params.pin);
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada o PIN inválido" });
      return;
    }
    const participants = await getParticipants(session.id);
    res.json({ session, participantsCount: participants.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.get("/sessions/:id/leaderboard", async (req, res) => {
  try {
    const board = await getLeaderboard(Number(req.params.id), 10);
    res.json(board);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.get("/sessions/:id/report", requireAuth, async (req, res) => {
  try {
    const report = await getSessionReport(Number(req.params.id));
    res.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Cancelar sesión activa (por PIN o por ID)
router.post("/sessions/:pin/cancel", requireAuth, async (req, res) => {
  try {
    const { pin } = req.params;
    const session = await getSessionByPin(pin);
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada o PIN inválido" });
      return;
    }
    await cancelSession(session.id);
    broadcastSessionCancelled(pin);
    res.json({ success: true, message: "Sesión cancelada exitosamente" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al cancelar la sesión";
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Búsqueda de Usuarios Registrados para Colaboración
// ---------------------------------------------------------------------------
router.get("/users/search", requireAuth, async (_req, res) => {
  try {
    const allUsers = await listUsers();
    // Retornar usuarios activos sin hashes de contraseña para autocompletar colaboración
    const filtered = allUsers
      .filter((u) => u.is_active)
      .map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
      }));
    res.json(filtered);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al buscar usuarios";
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Banco de Preguntas: Carpetas, Subcarpetas y Preguntas
// ---------------------------------------------------------------------------

// Listar todas las carpetas con estructura jerárquica
router.get("/bank/folders", requireAuth, async (_req, res) => {
  try {
    const folders = await getFolders();
    res.json(folders);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener carpetas";
    res.status(500).json({ error: message });
  }
});

// Crear carpeta o subcarpeta
router.post("/bank/folders", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const { name, parent_id, description, color } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "El nombre de la carpeta es obligatorio" });
      return;
    }
    const folder = await createFolder(
      { name, parent_id, description, color },
      req.user.id,
    );
    res.status(201).json(folder);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear carpeta";
    res.status(500).json({ error: message });
  }
});

// Actualizar carpeta
router.put("/bank/folders/:id", requireAuth, async (req, res) => {
  try {
    const folder = await updateFolder(Number(req.params.id), req.body);
    res.json(folder);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar carpeta";
    res.status(500).json({ error: message });
  }
});

// Eliminar carpeta (en cascada)
router.delete("/bank/folders/:id", requireAuth, async (req, res) => {
  try {
    await deleteFolder(Number(req.params.id));
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar carpeta";
    res.status(500).json({ error: message });
  }
});

// Listar preguntas del banco (filtro por carpeta o todas)
router.get("/bank/questions", requireAuth, async (req, res) => {
  try {
    const folderId = req.query.folder_id ? Number(req.query.folder_id) : undefined;
    const recursive = req.query.recursive === "true";
    const questions = await getBankQuestions(folderId, recursive);
    res.json(questions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener preguntas";
    res.status(500).json({ error: message });
  }
});

// Crear pregunta individual en carpeta
router.post("/bank/questions", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!req.body.folder_id) {
      res.status(400).json({ error: "Debes especificar la carpeta de destino" });
      return;
    }
    const created = await createBankQuestion(req.body, req.user.id);
    res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear pregunta en banco";
    res.status(500).json({ error: message });
  }
});

// Importar lote de preguntas desde Excel a una carpeta
router.post("/bank/questions/import-excel", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const { folder_id, questions } = req.body;
    if (!folder_id) {
      res.status(400).json({ error: "Debes seleccionar una carpeta de destino" });
      return;
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: "No se proporcionaron preguntas para importar" });
      return;
    }
    const result = await importExcelToFolder(Number(folder_id), questions, req.user.id);
    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al importar preguntas desde Excel";
    res.status(500).json({ error: message });
  }
});

// Actualizar pregunta del banco
router.put("/bank/questions/:id", requireAuth, async (req, res) => {
  try {
    const updated = await updateBankQuestion(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar pregunta";
    res.status(500).json({ error: message });
  }
});

// Eliminar pregunta del banco
router.delete("/bank/questions/:id", requireAuth, async (req, res) => {
  try {
    await deleteBankQuestion(Number(req.params.id));
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar pregunta";
    res.status(500).json({ error: message });
  }
});

// Copiar preguntas desde el banco hacia una presentación (existente o nueva)
router.post("/bank/copy-to-presentation", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const { activity_id, new_activity, question_ids } = req.body;
    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      res.status(400).json({ error: "No se seleccionaron preguntas para copiar" });
      return;
    }
    const target = await copyBankQuestionsToActivity({
      activityId: activity_id ? Number(activity_id) : undefined,
      newActivity: new_activity,
      questionIds: question_ids.map(Number),
      userId: req.user.id,
    });
    res.json({ success: true, activity: target });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al transferir preguntas";
    res.status(500).json({ error: message });
  }
});

export default router;

