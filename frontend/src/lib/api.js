import axios from "axios";

const backendUrl = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const api = axios.create({
  baseURL: `${backendUrl}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const resolveMediaUrl = (url) => {
  if (!url || url.startsWith("http")) return url;
  return `${backendUrl}${url}`;
};

export const formatApiError = (error) =>
  error?.response?.data?.detail || error?.message || "Ha ocurrido un error";
