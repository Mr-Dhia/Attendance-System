import api from "./api";

export const getEmployees = async () => {
  const res = await api.get("/employees");
  return res.data;
};

export const getEmployee = async (id) => {
  const res = await api.get(`/employees/${id}`);
  return res.data;
};

export const createEmployee = async (formData) => {
  const res = await api.post("/employees", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateEmployee = async (id, formData) => {
  const res = await api.put(`/employees/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteEmployee = async (id) => {
  const res = await api.delete(`/employees/${id}`);
  return res.data;
};

export const requestFingerprintEnroll = async (id) => {
  const res = await api.post(`/employees/${id}/fingerprint/start`);
  return res.data;
};

export const removeFingerprint = async (id, fingerID) => {
  const res = await api.delete(`/employees/${id}/fingerprint/${fingerID}`);
  return res.data;
};