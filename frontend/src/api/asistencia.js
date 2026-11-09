import api from "./client";

export const getAsistenciaTurno = (turnoId) => api.get(`/asistencia/turno/${turnoId}`);
export const registrarAsistencia = (turnoId, data) => api.post(`/asistencia/turno/${turnoId}`, data);
export const updateAsistencia = (id, data) => api.patch(`/asistencia/${id}`, data);
export const getAsistenciaAlumno = (alumnoId) => api.get(`/asistencia/alumno/${alumnoId}`);

