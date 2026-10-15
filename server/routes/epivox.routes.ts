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
} from "../services/activityService.js";
import {
  createSession,
  getAllSessions,
  getSessionByPin,
  getLeaderboard,
  getParticipants,
  getSessionReport,
} from "../services/sessionService.js";

const router = Router();

// Actividades & Plantillas
router.get("/activities", async (_req, res) => {
  try {
    const list = await getActivities();
    res.json(list);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.get("/templates", async (_req, res) => {
  try {
    const templates = await getTemplates();
    res.json(templates);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.get("/activities/:id", async (req, res) => {
  try {
    const item = await getActivityById(Number(req.params.id));
    if (!item)
      return res.status(404).json({ error: "Actividad no encontrada" });
    const questions = await getQuestionsByActivityId(item.id);
    res.json({ ...item, questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.post("/activities", async (req, res) => {
  try {
    const created = await createActivity(req.body);
    res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.put("/activities/:id", async (req, res) => {
  try {
    const updated = await updateActivity(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.delete("/activities/:id", async (req, res) => {
  try {
    await deleteActivity(Number(req.params.id));
    res.json({ success: true, message: "Actividad eliminada" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.post("/activities/:id/clone", async (req, res) => {
  try {
    const cloned = await cloneActivity(Number(req.params.id));
    res.status(201).json(cloned);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Preguntas
router.post("/activities/:id/questions", async (req, res) => {
  try {
    const created = await createQuestion({
      ...req.body,
      activity_id: Number(req.params.id),
    });
    res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const updated = await updateQuestion(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    await deleteQuestion(Number(req.params.id));
    res.json({ success: true, message: "Pregunta eliminada" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.put("/activities/:id/reorder", async (req, res) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      return res
        .status(400)
        .json({ error: "questionIds debe ser un arreglo de IDs" });
    }
    await reorderQuestions(Number(req.params.id), questionIds);
    res.json({ success: true, message: "Orden de preguntas actualizado" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Sesiones & Reportes
router.get("/sessions", async (_req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json(sessions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

router.post("/sessions/create", async (req, res) => {
  try {
    const { activityId, mode, anonymous, maxParticipants } = req.body;
    const session = await createSession(Number(activityId || 1), 1, {
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

router.get("/sessions/:pin", async (req, res) => {
  try {
    const session = await getSessionByPin(req.params.pin);
    if (!session)
      return res
        .status(404)
        .json({ error: "Sesión no encontrada o PIN inválido" });
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

router.get("/sessions/:id/report", async (req, res) => {
  try {
    const report = await getSessionReport(Number(req.params.id));
    res.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

export default router;
