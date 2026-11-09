import { Router } from "express";
import { uploadFile, getFile, deleteFile } from "../controllers/file.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

// POST /api/files - Subida de archivo (multipart/form-data)
router.post("/", requireAuth, upload.single("file"), uploadFile);

// GET /api/files/:id - Descarga protegida por ownership
router.get("/:id", requireAuth, getFile);

// DELETE /api/files/:id - Eliminación (solo staff admin/coordinador)
router.delete("/:id", requireAuth, requireRole("admin", "coordinador"), deleteFile);

export default router;

