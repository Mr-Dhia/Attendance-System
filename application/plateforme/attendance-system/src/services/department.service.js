import api from "./api";

export const getDepartments = async () => {
  const res = await api.get("/departments");
  return res.data;
};

export const createDepartment = async (deptData) => {
  const res = await api.post("/departments", deptData);
  return res.data;
};

export const updateDepartment = async (id, deptData) => {
  const res = await api.put(`/departments/${id}`, deptData);
  return res.data;
};

export const deleteDepartment = async (id) => {
  const res = await api.delete(`/departments/${id}`);
  return res.data;
};

export const addPosition = async (deptId, posData) => {
  const res = await api.post(`/departments/${deptId}/positions`, posData);
  return res.data;
};

export const updatePosition = async (deptId, posId, posData) => {
  const res = await api.put(`/departments/${deptId}/positions/${posId}`, posData);
  return res.data;
};

export const deletePosition = async (deptId, posId) => {
  const res = await api.delete(`/departments/${deptId}/positions/${posId}`);
  return res.data;
};
