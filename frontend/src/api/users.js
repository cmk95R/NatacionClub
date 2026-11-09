import api from "./client";

export const editUserApi = (data) => api.patch("/auth/me", data);

