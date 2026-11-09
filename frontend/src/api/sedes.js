import api from "./client";

// --- Sedes ---
export const getSedes = (params) => api.get("/sedes", { params });
export const getSedeById = (id) => api.get(`/sedes/${id}`);
export const createSede = (data) => api.post("/admin/sedes", data);
export const updateSede = (id, data) => api.put(`/admin/sedes/${id}`, data);
export const deleteSede = (id) => api.delete(`/admin/sedes/${id}`);

// --- Piletas ---
export const getPiletas = (params) => api.get("/piletas", { params });
export const getPiletaById = (id) => api.get(`/piletas/${id}`);
export const createPileta = (data) => api.post("/admin/piletas", data);
export const updatePileta = (id, data) => api.put(`/admin/piletas/${id}`, data);
export const deletePileta = (id) => api.delete(`/admin/piletas/${id}`);

