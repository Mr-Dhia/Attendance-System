import api from "./api";

export const getAllSchedules = async () => {
  const res = await api.get("/schedule");
  return res.data;
};

export const getWorkSchedule = async () => {
  const res = await api.get("/schedule");
  return res.data?.[0] || { jours: [] };
};

export const createSchedule = async (data) => {
  const res = await api.post("/schedule", data);
  return res.data;
};

export const updateSchedule = async (id, data) => {
  const res = await api.put(`/schedule/${id}`, data);
  return res.data;
};

export const updateWorkSchedule = async (data) => {
  const all = await getAllSchedules();
  const targetId = data.scheduleId || all?.[0]?._id;
  if (targetId) {
    return await updateSchedule(targetId, data);
  }
};

export const deleteSchedule = async (id) => {
  const res = await api.delete(`/schedule/${id}`);
  return res.data;
};

export const assignEmployeesToSchedule = async (scheduleId, employeeIds) => {
  const res = await api.post(`/schedule/${scheduleId}/assign`, { employeeIds });
  return res.data;
};

export const getWeeklyAssignments = async (weekDate) => {
  const res = await api.get("/schedule/weekly", { params: { weekDate } });
  return res.data;
};

export const assignWeeklyEmployees = async (scheduleId, employeeIds, weekDate) => {
  const res = await api.post("/schedule/weekly/assign", { scheduleId, employeeIds, weekDate });
  return res.data;
};
