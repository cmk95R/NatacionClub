import api from "./client";

// POST /api/auth/login - Email + Password (Staff y Tutores)
export const loginApi = (credentials) => api.post("/auth/login", credentials);

// POST /api/auth/login-pin - DNI + PIN (Alumnos)
export const loginPinApi = (credentials) => api.post("/auth/login-pin", credentials);

// POST /api/auth/logout
export const logoutApi = () => api.post("/auth/logout");

// GET /api/auth/me - Perfil del usuario actual
export const meApi = () => api.get("/auth/me");
export const profileApi = meApi;
