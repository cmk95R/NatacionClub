import api from "./client";

export const getHorarios = (params) => api.get("/horarios", { params });
export const getHorarioById = (id) => api.get(`/horarios/${id}`);
export const createHorario = (data) => api.post("/admin/horarios", data);
export const updateHorario = (id, data) => api.put(`/admin/horarios/${id}`, data);
export const deleteHorario = (id) => api.delete(`/admin/horarios/${id}`);

