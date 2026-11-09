import api from "./client";

export const getTurnos = (params) => api.get("/turnos", { params });
export const getTurnoById = (id) => api.get(`/turnos/${id}`);
export const generarTurnos = (data) => api.post("/admin/turnos/generar", data);
export const poblarGrillaHorarios = (data) => api.post("/admin/turnos/grilla-horarios", data);
export const suspenderTurno = (id, data) => api.patch(`/admin/turnos/${id}/suspender`, data);
export const deleteTurno = (id) => api.delete(`/admin/turnos/${id}`);
