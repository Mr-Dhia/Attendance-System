import { useState, useEffect } from "react";
import {
  Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Typography, Box, useTheme, useMediaQuery,
  Divider, Stack, Paper, Avatar,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import SensorsIcon from "@mui/icons-material/Sensors";
import LockClockIcon from "@mui/icons-material/LockClock";
import ShieldIcon from "@mui/icons-material/Shield";
import BusinessIcon from "@mui/icons-material/Business";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout, getUser } from "../services/auth.service";
import { getPhotoUrl } from "../services/api";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

export const drawerWidth = 270;

const mainNav = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Employés", icon: <PeopleIcon />, path: "/employees" },
  { text: "Départements & Postes", icon: <BusinessIcon />, path: "/departments" },
  { text: "Présences", icon: <AccessTimeIcon />, path: "/attendance" },
  { text: "Gestion Horaires", icon: <LockClockIcon />, path: "/schedules" },
  { text: "Affectation Horaires", icon: <GroupAddIcon />, path: "/schedules/assignments" },
];

const adminNav = [
  { text: "Profil System", icon: <PersonIcon />, path: "/profile" },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarTime, setSidebarTime] = useState("");
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const timeFormatted = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setSidebarTime(`${dateFormatted} • ${timeFormatted}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Re-sync user from localStorage when it's updated (e.g. after profile edit)
  useEffect(() => {
    const handleUserUpdate = () => setUser(getUser());
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const renderNavList = (items) => (
    <List sx={{ display: "flex", flexDirection: "column", gap: 1, p: 0 }}>
      {items.map((item) => {
        const active = location.pathname === item.path;
        return (
          <ListItemButton
            key={item.text}
            component={Link}
            to={item.path}
            onClick={onClose}
            sx={{
              borderRadius: 3,
              py: 1.4,
              px: 2,
              backgroundColor: active
                ? "rgba(2, 132, 199, 0.28)"
                : "transparent",
              backgroundImage: active
                ? "linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(99, 102, 241, 0.2) 100%)"
                : "none",
              color: active ? "#38bdf8" : "#94a3b8",
              border: active ? "1px solid rgba(56, 189, 248, 0.45)" : "1px solid transparent",
              boxShadow: active ? "0 0 20px rgba(56, 189, 248, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)" : "none",
              borderLeft: active ? "4px solid #38bdf8" : "1px solid transparent",
              "&:hover": {
                backgroundColor: "rgba(56, 189, 248, 0.14)",
                color: "#f8fafc",
                transform: "translateX(4px)",
              },
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <ListItemIcon sx={{ color: active ? "#38bdf8" : "#64748b", minWidth: 38 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 800 : 600, letterSpacing: active ? "0.2px" : "normal" }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  const content = (
    <Box sx={{ height: "100%", maxHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top Section (Scrollable) */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: 1 }}>
        {/* Brand Header */}
        <Box px={2.5} pt={1.5} pb={1} display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px rgba(2, 132, 199, 0.45)",
            }}
          >
            <FingerprintIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px" lineHeight={1.2}>
              BioPulse
            </Typography>
            <Box display="flex" alignItems="center" gap={0.6}>
              <SensorsIcon sx={{ color: "#10b981", fontSize: 12 }} />
              <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 700, fontSize: 10 }}>
                TERMINAL ONLINE
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Live Date & Time Widget */}
        <Box px={2} pb={1}>
          <Paper
            elevation={0}
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 2,
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box flexGrow={1}>
              <Typography variant="body2" fontWeight={800} color="#f8fafc" lineHeight={1.2} fontSize={12}>
                {sidebarTime || "--:--"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 700, fontSize: 9 }}>
                ● HORLOGE DIRECTE
              </Typography>
            </Box>
          </Paper>
        </Box>

        <Divider sx={{ borderColor: "rgba(56, 189, 248, 0.15)", mx: 2, my: 1 }} />

        {/* Section 1: Main Navigation */}
        <Box px={2} mb={1.5}>
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 800, letterSpacing: "0.8px", px: 1, mb: 0.8, display: "block", fontSize: 10 }}
          >
            NAVIGATION PRINCIPALE
          </Typography>
          {renderNavList(mainNav)}
        </Box>

        {/* Section 2: Administration */}
        <Box px={2} mb={1}>
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 800, letterSpacing: "0.8px", px: 1, mb: 0.8, display: "block", fontSize: 10 }}
          >
            ADMINISTRATION
          </Typography>
          {renderNavList(adminNav)}
        </Box>
      </Box>

      {/* Bottom Section: Admin Profile Card + Déconnexion (Fixed at bottom) */}
      <Box sx={{ flexShrink: 0, borderTop: "1px solid rgba(56, 189, 248, 0.15)", backgroundColor: "#090d16" }}>
        {/* Admin Profile Card */}
        <Box px={2} pt={1} pb={0.8}>
          <Paper
            elevation={0}
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(56, 189, 248, 0.18)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              cursor: "pointer",
              "&:hover": { borderColor: "rgba(56, 189, 248, 0.35)", backgroundColor: "rgba(15, 23, 42, 0.9)" },
              transition: "all 0.2s",
            }}
            onClick={() => navigate("/profile")}
          >
            <Avatar
              src={getPhotoUrl(user?.photo)}
              sx={{
                width: 36,
                height: 36,
                border: "2px solid rgba(56, 189, 248, 0.4)",
                bgcolor: "#0284c7",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </Avatar>
            <Box flexGrow={1} minWidth={0}>
              <Typography variant="body2" fontWeight={700} color="#f8fafc" noWrap fontSize={13}>
                {user?.name || "Administrateur"}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <ShieldIcon sx={{ color: "#38bdf8", fontSize: 10 }} />
                <Typography variant="caption" color="#38bdf8" fontWeight={700} fontSize={10}>
                  {user?.role === "admin" ? "Administrateur" : user?.role || "Admin"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Déconnexion Button */}
        <Box px={2} pb={1.5}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 3,
              py: 1.2,
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              backgroundColor: "rgba(239, 68, 68, 0.05)",
              "&:hover": {
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                borderColor: "rgba(239, 68, 68, 0.4)",
              },
              transition: "all 0.2s",
            }}
          >
            <ListItemIcon sx={{ color: "#f87171", minWidth: 38 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Déconnexion"
              primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </Box>
  );

  const paperSx = {
    width: drawerWidth,
    height: "100vh",
    maxHeight: "100vh",
    background: "linear-gradient(180deg, #0b0f19 0%, #0f172a 100%)",
    color: "#fff",
    borderRight: "1px solid rgba(56, 189, 248, 0.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "10px 0 30px rgba(0,0,0,0.5)",
  };

  if (isDesktop) {
    return (
      <Drawer variant="permanent" sx={{ width: drawerWidth, "& .MuiDrawer-paper": paperSx }}>
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ "& .MuiDrawer-paper": paperSx }}
    >
      {content}
    </Drawer>
  );
}
