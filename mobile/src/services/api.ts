import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { storage } from "./storage";

const BASE_URL = "http://192.168.1.176:8000/api"; // ← your PC IP (192.168.0.x)

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const token = await storage.get("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.remove("auth_token");
      await storage.remove("auth_user");
    }
    return Promise.reject(error);
  },
);

export default api;
