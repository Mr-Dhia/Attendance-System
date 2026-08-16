import api from "./api";

export const getAttendance = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/attendance?${params}`);
  return res.data;
};

export const createAttendance = async (data) => {
  const res = await api.post("/attendance", data);
  return res.data;
};

export const updateAttendance = async (id, data) => {
  const res = await api.put(`/attendance/${id}`, data);
  return res.data;
};

export const deleteAttendance = async (id) => {
  const res = await api.delete(`/attendance/${id}`);
  return res.data;
};