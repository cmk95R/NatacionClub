import { Router } from "express";
import Config from "../models/Config.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Valores por defecto de configuración del sistema
const DEFAULT_CONFIGS = {
  reservas_abiertas: true,
  inscripciones_abiertas: true,
  ventana_reserva_dias: 30,
  apto_medico_requerido: false,
  cancelacion_anticipacion_horas: 2,
};

// GET /api/config o GET /api/admin/config — Obtener todos los flags
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const docs = await Config.find().lean();
    const configMap = { ...DEFAULT_CONFIGS };

    for (const doc of docs) {
      configMap[doc.key] = doc.value;
    }

    return res.json({ ok: true, configs: configMap });
  } catch (err) {
    next(err);
  }
});

// GET /api/config/:key — Obtener un flag específico
router.get("/:key", requireAuth, async (req, res, next) => {
  try {
    const { key } = req.params;
    const doc = await Config.findOne({ key }).lean();

    const value = doc ? doc.value : (DEFAULT_CONFIGS[key] ?? null);
    return res.json({ ok: true, key, value });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/config/:key o PATCH /api/config/:key — Modificar flag (solo admin y coordinador)
router.patch(
  "/:key",
  requireAuth,
  requireRole("admin", "coordinador"),
  async (req, res, next) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined) {
        return res.status(400).json({ message: "Se requiere un 'value' para actualizar" });
      }

      const doc = await Config.findOneAndUpdate(
        { key },
        { value },
        { new: true, upsert: true, runValidators: true }
      ).lean();

      return res.json({
        ok: true,
        message: `Configuración '${key}' actualizada`,
        key: doc.key,
        value: doc.value,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
