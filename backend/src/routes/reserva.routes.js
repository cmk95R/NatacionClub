import { Router } from "express";
import { body } from "express-validator";
import {
  crearReservaController,
  cancelarReservaController,
  listMisReservas,
  listReservasByTurno,
  getDisponibilidad,
  listReservasPendientesConfirmacion,
  confirmarReservaController,
  tomarReservaController,
  asignarEntrenadorController,
  listDisponiblesParaEntrenador,
} from "../controllers/reserva.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = Router();

const reservaValidations = [
  body("alumnoId")
    .notEmpty()
    .withMessage("El ID del alumno es obligatorio")
    .isMongoId()
    .withMessage("ID de alumno inválido"),
  body("turnoId")
    .notEmpty()
    .withMessage("El ID del turno es obligatorio")
    .isMongoId()
    .withMessage("ID de turno inválido"),
];

// ── Públicas (autenticadas) ─────────────────────────────────────────────────

// GET /api/reservas/disponibilidad → franjas agrupadas (SIN detalle de carril/turno)
// Query: ?sede=&desde=&hasta=&turno=mañana|tarde|noche
router.get("/disponibilidad", requireAuth, getDisponibilidad);

// GET /api/reservas/mias → Reservas del tutor (sus hijos) o del propio alumno
router.get("/mias", requireAuth, listMisReservas);

// GET /api/reservas/turno/:id → Reservas de un turno concreto (Staff y Entrenadores)
router.get(
  "/turno/:id",
  requireAuth,
  requireRole("admin", "coordinador", "entrenador"),
  listReservasByTurno
);

// POST /api/reservas → Crear solicitud (inicia como "sujeto_confirmacion" para tutor/alumno)
router.post("/", requireAuth, reservaValidations, validateRequest, crearReservaController);

// DELETE /api/reservas/:id → Cancelar reserva propia
router.delete("/:id", requireAuth, cancelarReservaController);

// ── Entrenador ──────────────────────────────────────────────────────────────

// GET /api/reservas/entrenador/disponibles → Lista de solicitudes sin entrenador asignado
router.get(
  "/entrenador/disponibles",
  requireAuth,
  requireRole("entrenador", "admin", "coordinador"),
  listDisponiblesParaEntrenador
);

// PATCH /api/reservas/:id/tomar → Entrenador se asigna a una reserva
router.patch(
  "/:id/tomar",
  requireAuth,
  requireRole("entrenador"),
  tomarReservaController
);

// ── Administrativas (admin / coordinador) ───────────────────────────────────

// GET /api/reservas/admin/pendientes → Lista de solicitudes sujetas a confirmación
router.get(
  "/admin/pendientes",
  requireAuth,
  requireRole("admin", "coordinador"),
  listReservasPendientesConfirmacion
);

// PATCH /api/reservas/admin/:id/confirmar → Aprobar o rechazar solicitud
router.patch(
  "/admin/:id/confirmar",
  requireAuth,
  requireRole("admin", "coordinador"),
  confirmarReservaController
);

// PATCH /api/reservas/admin/:id/asignar-entrenador → Coordinador asigna entrenador manualmente
router.patch(
  "/admin/:id/asignar-entrenador",
  requireAuth,
  requireRole("admin", "coordinador"),
  asignarEntrenadorController
);

export default router;
