import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createTheme, ThemeProvider, CssBaseline, CircularProgress, Box } from "@mui/material";
import api from "./services/api";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Profile from "./pages/Profile";
import AddEmployee from "./pages/AddEmployee";
import EmployeeProfile from "./pages/EmployeeProfile";
import EditEmployee from "./pages/EditEmployee";
import CompleteEmployee from "./pages/CompleteEmployee";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Schedules from "./pages/Schedules";
import ScheduleAssignments from "./pages/ScheduleAssignments";
import Departments from "./pages/Departments";
import { ServerStatusProvider, useServerStatus } from "./context/ServerStatusContext";
import ServerOfflineScreen from "./components/ServerOfflineScreen";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#090d16",
      paper: "#0f172a",
    },
    primary: {
      main: "#0284c7",
      light: "#38bdf8",
      dark: "#0369a1",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#6366f1",
      light: "#a5b4fc",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      contrastText: "#ffffff",
    },
    error: {
      main: "#f43f5e",
      light: "#fb7185",
      contrastText: "#ffffff",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
  },
});

function PrivateRoute({ children }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    api.get("/auth/me")
      .then(() => setAuth(true))
      .catch((err) => {
        // Network or server down error: do not force redirect to login
        const isNetworkError =
          !err.response ||
          err.code === "ERR_NETWORK" ||
          err.code === "ECONNREFUSED" ||
          err.code === "ECONNABORTED";
        if (!isNetworkError) {
          setAuth(false);
        }
      });
  }, []);

  if (auth === null) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#090d16">
        <CircularProgress sx={{ color: "#0284c7" }} />
      </Box>
    );
  }

  return auth ? children : <Navigate to="/" />;
}

function AppContent() {
  const { isServerDown } = useServerStatus();

  if (isServerDown) {
    return <ServerOfflineScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/add" element={<AddEmployee />} />
          <Route path="/employees/:id" element={<EmployeeProfile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/schedules/assignments" element={<ScheduleAssignments />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/employees/:id/edit" element={<EditEmployee />} />
          <Route path="/employees/:id/complete" element={<CompleteEmployee />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ServerStatusProvider>
        <AppContent />
      </ServerStatusProvider>
    </ThemeProvider>
  );
}

export default App;