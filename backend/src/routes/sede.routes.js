import { Router } from "express";
import { body } from "express-validator";
import {
  listSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede,
} from "../controllers/sede.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const sedeValidations = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la sede es obligatorio")
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),
];

// Lectura: Cualquier usuario autenticado (staff, tutor, alumno)
router.get("/", requireAuth, listSedes);
router.get("/:id", requireAuth, getSedeById);

// Escritura: Solo admin y coordinador
router.post(
  "/",
  requireAuth,
  requireRole("admin", "coordinador"),
  sedeValidations,
  validateRequest,
  createSede
);

router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  validateRequest,
  updateSede
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  deleteSede
);

export default router;

