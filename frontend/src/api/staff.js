import api from "./client";

export const getStaff = (params) => api.get("/staff", { params });
export const getStaffById = (id) => api.get(`/admin/staff/${id}`);
export const createStaff = (data) => api.post("/admin/staff", data);
export const updateStaff = (id, data) => api.put(`/admin/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/admin/staff/${id}`);
