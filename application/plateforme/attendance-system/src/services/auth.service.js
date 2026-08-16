import api from "./api";

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  if (res.data.twoFactor) {
    return { twoFactor: true, email };
  }
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

export const verifyOTP = async (email, otp) => {
  const res = await api.post("/auth/2fa/verify", { email, otp });
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

export const toggleTwoFactor = async () => {
  const res = await api.put("/auth/2fa/toggle");
  return res.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("user");
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = async () => {
  try {
    await api.get("/auth/me");
    return true;
  } catch {
    return false;
  }
};