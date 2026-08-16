import api from "./api";

export const getStats = async () => {
  const res = await api.get("/dashboard/stats");
  return res.data;
};

export const getWeekData = async () => {
  const res = await api.get("/dashboard/week");
  return res.data;
};

export const getRecentLogs = async () => {
  const res = await api.get("/dashboard/logs");
  return res.data;
};