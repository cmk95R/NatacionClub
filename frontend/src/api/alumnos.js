import api from "./client";

export const getAlumnos = (params) => api.get("/alumnos", { params });
export const getMisHijos = () => api.get("/alumnos/mis-hijos");
export const getAlumnoById = (id) => api.get(`/alumnos/${id}`);
export const createAlumno = (data) => api.post("/admin/alumnos", data);
export const updateAlumno = (id, data) => api.put(`/admin/alumnos/${id}`, data);
export const deleteAlumno = (id) => api.delete(`/admin/alumnos/${id}`);

