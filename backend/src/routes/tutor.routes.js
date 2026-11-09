import { Router } from "express";
import { body } from "express-validator";
import {
  listTutores,
  getTutorById,
  createTutor,
  updateTutor,
  deleteTutor,
} from "../controllers/tutor.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const tutorValidations = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2 }),
  body("apellido")
    .trim()
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ min: 2 }),
  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un email válido")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),
];

// GET /api/admin/tutores - Staff administrativo
router.get("/", requireAuth, requireRole("admin", "coordinador"), listTutores);

// GET /api/admin/tutores/:id - Staff administrativo o el propio tutor
router.get("/:id", requireAuth, getTutorById);

// POST /api/admin/tutores - Alta de tutor
router.post(
  "/",
  requireAuth,
  requireRole("admin", "coordinador"),
  tutorValidations,
  validateRequest,
  createTutor
);

// PUT /api/admin/tutores/:id
router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  validateRequest,
  updateTutor
);

// DELETE /api/admin/tutores/:id
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  deleteTutor
);

export default router;

