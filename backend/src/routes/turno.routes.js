import { Router } from "express";
import { body } from "express-validator";
import {
  generarTurnosController,
  poblarGrillaHorariosController,
  listTurnos,
  getTurnoById,
  suspenderTurno,
  deleteTurno,
} from "../controllers/turno.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const generarValidations = [
  body("desde")
    .notEmpty()
    .withMessage("La fecha 'desde' es obligatoria")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Formato de fecha inválido para 'desde' (requerido YYYY-MM-DD)"),
  body("hasta")
    .notEmpty()
    .withMessage("La fecha 'hasta' es obligatoria")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Formato de fecha inválido para 'hasta' (requerido YYYY-MM-DD)"),
  body("sede").optional().isMongoId().withMessage("ID de sede inválido"),
  body("horarioIds").optional().isArray().withMessage("horarioIds debe ser un arreglo de IDs"),
  body("grillaCompleta").optional().isBoolean(),
];

// Lectura de turnos (tutores, alumnos, staff)
router.get("/", requireAuth, listTurnos);
router.get("/:id", requireAuth, getTurnoById);

// Generación de turnos (admin y coordinador)
router.post(
  "/generar",
  requireAuth,
  requireRole("admin", "coordinador"),
  generarValidations,
  validateRequest,
  generarTurnosController
);

// Población de grilla completa de horarios 07:00 a 22:00 (admin y coordinador)
router.post(
  "/grilla-horarios",
  requireAuth,
  requireRole("admin", "coordinador"),
  poblarGrillaHorariosController
);

// Suspender turno (admin y coordinador)
router.patch(
  "/:id/suspender",
  requireAuth,
  requireRole("admin", "coordinador"),
  suspenderTurno
);

// Eliminar turno definitivamente (admin y coordinador)
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  deleteTurno
);

export default router;
