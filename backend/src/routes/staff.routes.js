import express from "express";
import {
  listStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staff.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(requireAuth);

// GET accesible para staff (para selectores de entrenadores en horarios, directorio, etc.)
router.get("/", requireRole("admin", "coordinador", "entrenador"), listStaff);
router.get("/:id", requireRole("admin", "coordinador"), getStaffById);

// Rutas de administración y edición (solo Admin y Coordinador)
router.post("/", requireRole("admin", "coordinador"), createStaff);
router.put("/:id", requireRole("admin", "coordinador"), updateStaff);
router.delete("/:id", requireRole("admin", "coordinador"), deleteStaff);

export default router;
