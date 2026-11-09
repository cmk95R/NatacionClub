import api from "./client";

export const getConfigs = () => api.get("/config");
export const getConfig = (key) => api.get(`/config/${key}`);
export const getConfigApi = getConfig;
export const updateConfig = (key, value) => api.patch(`/admin/config/${key}`, { value });
