import { Router } from "express";
import { body } from "express-validator";
import {
  getAsistenciaByTurno,
  registrarAsistenciaTurno,
  updateAsistencia,
  getAsistenciaByAlumno,
} from "../controllers/asistencia.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const updateValidations = [
  body("estado")
    .optional()
    .isIn(["presente", "ausente", "justificada", "recupero"])
    .withMessage("Estado de asistencia inválido"),
];

// GET /api/asistencia/turno/:turnoId - Ver asistencia del turno (Staff / Entrenador)
router.get(
  "/turno/:turnoId",
  requireAuth,
  requireRole("admin", "coordinador", "entrenador"),
  getAsistenciaByTurno
);

// POST /api/asistencia/turno/:turnoId - Registrar asistencia masiva
router.post(
  "/turno/:turnoId",
  requireAuth,
  requireRole("admin", "coordinador", "entrenador"),
  registrarAsistenciaTurno
);

// PATCH /api/asistencia/:id - Edición individual
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador", "entrenador"),
  updateValidations,
  validateRequest,
  updateAsistencia
);

// GET /api/asistencia/alumno/:alumnoId - Historial de asistencia del alumno
router.get("/alumno/:alumnoId", requireAuth, getAsistenciaByAlumno);

export default router;

