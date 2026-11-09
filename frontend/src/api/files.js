import api from "./client";

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/files", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getFileDownloadUrl = (fileId) => {
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return `${baseURL}/files/${fileId}`;
};

export const deleteFile = (fileId) => api.delete(`/files/${fileId}`);

