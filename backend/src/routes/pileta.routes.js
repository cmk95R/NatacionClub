import { Router } from "express";
import { body } from "express-validator";
import {
  listPiletas,
  getPiletaById,
  createPileta,
  updatePileta,
  deletePileta,
} from "../controllers/pileta.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const piletaValidations = [
  body("sede").notEmpty().withMessage("La sede es obligatoria").isMongoId().withMessage("ID de sede inválido"),
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la pileta es obligatorio")
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),
  body("carriles")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La cantidad de carriles debe ser un número entero mayor a 0"),
];

// Lectura
router.get("/", requireAuth, listPiletas);
router.get("/:id", requireAuth, getPiletaById);

// Escritura: solo admin y coordinador
router.post(
  "/",
  requireAuth,
  requireRole("admin", "coordinador"),
  piletaValidations,
  validateRequest,
  createPileta
);

router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  validateRequest,
  updatePileta
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinador"),
  deletePileta
);

export default router;

