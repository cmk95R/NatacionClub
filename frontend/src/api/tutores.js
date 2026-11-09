import api from "./client";

export const getTutores = (params) => api.get("/admin/tutores", { params });
export const getTutorById = (id) => api.get(`/admin/tutores/${id}`);
export const createTutor = (data) => api.post("/admin/tutores", data);
export const updateTutor = (id, data) => api.put(`/admin/tutores/${id}`, data);
export const deleteTutor = (id) => api.delete(`/admin/tutores/${id}`);

