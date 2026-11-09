import { Router } from "express";
import { body } from "express-validator";
import {
  listHorarios,
  getHorarioById,
  createHorario,
  updateHorario,
  deleteHorario,
} from "../controllers/horario.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const horarioValidations = [
  body("sede").notEmpty().withMessage("La sede es obligatoria").isMongoId().withMessage("ID de sede inválido"),
  body("pileta").notEmpty().withMessage("La pileta es obligatoria").isMongoId().withMessage("ID de pileta inválido"),
  body("carril").isInt({ min: 1 }).withMessage("El carril debe ser un número entero mayor a 0"),
  body("diaSemana")
    .isIn(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"])
    .withMessage("Día de la semana inválido"),
  body("horaInicio")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("La hora de inicio debe tener formato HH:mm (ej. 09:00 o 18:30)"),
  body("duracionMin").isInt({ min: 15 }).withMessage("La duración mínima es de 15 minutos"),
  body("cupoMax").isInt({ min: 1 }).withMessage("El cupo máximo debe ser de al menos 1 alumno"),
  body("nivel")
    .isIn(["iniciacion", "intermedio", "avanzado", "competitivo"])
    .withMessage("Nivel inválido (iniciacion, intermedio, avanzado, competitivo)"),
  body("entrenador").optional({ nullable: true }).isMongoId().withMessage("ID de entrenador inválido"),
];

// Lectura (tanto /api/horarios como /api/admin/horarios)
router.get("/", requireAuth, listHorarios);
router.get("/:id", requireAuth, getHorarioById);

// Escritura: solo admin y coordinador
router.post(
  "/",
  requireAuth,
  requireRole("admin", "coordinador"),
  horarioValidations,
  validateRequest,
  createHorario
);

router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  validateRequest,
  updateHorario
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  deleteHorario
);

export default router;

