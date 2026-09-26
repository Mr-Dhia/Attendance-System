import axios from "axios";

const getDynamicServerUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:5000`;
    }
  }
  return "http://localhost:5000";
};

export const SERVER_URL = getDynamicServerUrl();

export const getPhotoUrl = (photoPath) => (photoPath ? `${SERVER_URL}${photoPath}` : "");

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur global des réponses HTTP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Interception des erreurs de réseau ou serveur injoignable
    if (!error.response) {
      console.warn("[API Network Warning] Le serveur backend est injoignable ou hors ligne.");
    }
    return Promise.reject(error);
  }
);

export default api;