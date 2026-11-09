import api from "./client";

export const getDisponibilidad = (params) => api.get("/reservas/disponibilidad", { params });
export const getMisReservas = (params) => api.get("/reservas/mias", { params });
export const getReservasTurno = (turnoId) => api.get(`/reservas/turno/${turnoId}`);
export const createReserva = (data) => api.post("/reservas", data);
export const cancelarReserva = (id, data) => api.delete(`/reservas/${id}`, { data });

// Entrenador
export const getDisponiblesParaEntrenador = (params) =>
  api.get("/reservas/entrenador/disponibles", { params });
export const tomarReserva = (id) => api.patch(`/reservas/${id}/tomar`);

// Admin/Coordinador
export const getReservasPendientesConfirmacion = (params) =>
  api.get("/reservas/admin/pendientes", { params });
export const confirmarReserva = (id, data) =>
  api.patch(`/reservas/admin/${id}/confirmar`, data);
export const asignarEntrenadorReserva = (id, data) =>
  api.patch(`/reservas/admin/${id}/asignar-entrenador`, data);
