import { Router } from "express";
import { body } from "express-validator";
import {
  listAlumnos,
  listMisHijos,
  getAlumnoById,
  createAlumno,
  updateAlumno,
  deleteAlumno,
} from "../controllers/alumno.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const alumnoValidations = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),
  body("apellido")
    .trim()
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ min: 2 })
    .withMessage("El apellido debe tener al menos 2 caracteres"),
  body("dni")
    .trim()
    .notEmpty()
    .withMessage("El DNI es obligatorio")
    .matches(/^\d+$/)
    .withMessage("El DNI debe ser numérico"),
  body("nivel")
    .optional()
    .isIn(["iniciacion", "intermedio", "avanzado", "competitivo"])
    .withMessage("Nivel de alumno inválido"),
  body("sede").optional({ nullable: true }).isMongoId().withMessage("ID de sede inválido"),
  body("tutorPrincipal").optional({ nullable: true }).isMongoId().withMessage("ID de tutor inválido"),
];

// Rutas de lectura
// GET /api/alumnos - Staff
router.get("/", requireAuth, requireRole("admin", "coordinador", "entrenador"), listAlumnos);

// GET /api/alumnos/mis-hijos - Tutor
router.get("/mis-hijos", requireAuth, requireRole("tutor"), listMisHijos);

// GET /api/alumnos/:id - Staff, tutor del alumno o el propio alumno
router.get("/:id", requireAuth, getAlumnoById);

// Rutas administrativas (POST /api/admin/alumnos o POST /api/alumnos)
router.post(
  "/",
  requireAuth,
  requireRole("admin", "coordinador"),
  alumnoValidations,
  validateRequest,
  createAlumno
);

router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  validateRequest,
  updateAlumno
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  deleteAlumno
);

export default router;

