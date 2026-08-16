import { useState, useEffect } from "react";
import {
  AppBar, Toolbar, Typography, Box, Avatar,
  IconButton, Badge, Popover, List, ListItem,
  ListItemText, ListItemAvatar, Divider, Menu,
  MenuItem, ListItemIcon, Chip, Stack, Tooltip, Button, Paper,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MenuIcon from "@mui/icons-material/Menu";
import { useLocation, useNavigate } from "react-router-dom";
import { logout, getUser } from "../services/auth.service";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../services/notification.service";
import api, { getPhotoUrl } from "../services/api";
import CancelIcon from "@mui/icons-material/Cancel";
import LockClockIcon from "@mui/icons-material/LockClock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import SensorsIcon from "@mui/icons-material/Sensors";
import DeleteIcon from "@mui/icons-material/Delete";
import { drawerWidth } from "./Sidebar";

const pages = {
  "/dashboard": { title: "Dashboard Command Center", icon: <DashboardIcon sx={{ fontSize: 20 }} />, color: "#06b6d4" },
  "/employees": { title: "Gestion des Employés & Biométrie", icon: <PeopleIcon sx={{ fontSize: 20 }} />, color: "#10b981" },
  "/attendance": { title: "Registre des Présences Biométriques", icon: <AccessTimeIcon sx={{ fontSize: 20 }} />, color: "#3b82f6" },
  "/schedules/assignments": { title: "Affectation des Horaires par Équipe", icon: <GroupAddIcon sx={{ fontSize: 20 }} />, color: "#10b981" },
  "/schedules": { title: "Gestion des Régimes d'Horaires", icon: <LockClockIcon sx={{ fontSize: 20 }} />, color: "#0284c7" },
  "/departments": { title: "Départements & Postes", icon: <PeopleIcon sx={{ fontSize: 20 }} />, color: "#f59e0b" },
  "/system/updates": { title: "Centre de Mise à Jour Code & Firmware OTA", icon: <SystemUpdateAltIcon sx={{ fontSize: 20 }} />, color: "#38bdf8" },
  "/profile": { title: "Profil & Paramètres Réseau", icon: <PersonIcon sx={{ fontSize: 20 }} />, color: "#8b5cf6" },
};

const notifTypeConfig = {
  retard: { icon: <AccessTimeIcon sx={{ fontSize: 16 }} />, color: "#f59e0b", label: "RETARD", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.35)", gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.1) 100%)" },
  absence: { icon: <CancelIcon sx={{ fontSize: 16 }} />, color: "#f87171", label: "ABSENCE", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.35)", gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.1) 100%)" },
  presence: { icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, color: "#34d399", label: "PRÉSENCE", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.35)", gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)" },
  empreinte: { icon: <FingerprintIcon sx={{ fontSize: 16 }} />, color: "#38bdf8", label: "EMPREINTE", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.35)", gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(2, 132, 199, 0.1) 100%)" },
  oubli_fin_service: { icon: <LockClockIcon sx={{ fontSize: 16 }} />, color: "#fb923c", label: "OUBLI SERVICE", bg: "rgba(249, 115, 22, 0.12)", border: "rgba(249, 115, 22, 0.35)", gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(194, 65, 12, 0.1) 100%)" },
};

export default function Navbar({ onMenuClick = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [dateStr, setDateStr] = useState("");
  const [clockStr, setClockStr] = useState("");
  const [bannerMsg, setBannerMsg] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data) {
          const existing = getUser() || {};
          // Smart merge: take all server fields, but preserve existing photo if server returns none
          const merged = {
            ...existing,
            ...res.data,
            photo: res.data.photo || existing.photo || null,
          };
          localStorage.setItem("user", JSON.stringify(merged));
          setUser(merged);
          window.dispatchEvent(new Event("user-updated"));
        }
      } catch {
        // user not auth or network error
      }
    };
    fetchMe();

    const handleUserUpdate = () => {
      setUser(getUser());
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const currentPage = Object.entries(pages).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + "/")
  );
  const pageInfo = currentPage?.[1] || pages["/dashboard"];

  const [notifAnchor, setNotifAnchor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
      setClockStr(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const chargerNotifications = () => {
    getNotifications()
      .then((data) =>
        setNotifications(
          data.map((n) => ({
            id: n._id,
            message: n.message,
            time: new Date(n.createdAt).toLocaleString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
            }),
            read: n.read,
            type: n.type,
            employeeId: n.employee?._id,
            employeePhoto: n.employee?.photo,
          }))
        )
      )
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    chargerNotifications();
    const timer = setInterval(chargerNotifications, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setBannerMsg("Notification supprimée");
      setTimeout(() => setBannerMsg(""), 3000);
    } catch {
      // ignore
    }
  };

  const handleOpenNotifications = async (e) => {
    setNotifAnchor(e.currentTarget);
    if (unread > 0) {
      await handleMarkAllAsRead();
    }
  };

  const handleCloseNotifications = () => {
    setNotifAnchor(null);
  };

  const handleLogout = () => {
    setMenuAnchor(null);
    logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        width: "100%",
        background: "linear-gradient(180deg, rgba(6, 9, 19, 0.96) 0%, rgba(9, 13, 22, 0.88) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(56, 189, 248, 0.28)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 4 }, py: 0.4, minHeight: { xs: 58, sm: 62 }, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Left Side: Mobile Menu Icon + Page Title */}
        <Stack direction="row" alignItems="center" gap={2}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ color: "#38bdf8", display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Stack direction="row" alignItems="center" gap={1.8}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${pageInfo.color}25 0%, rgba(15,23,42,0.8) 100%)`,
                border: `1px solid ${pageInfo.color}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: pageInfo.color,
                boxShadow: `0 0 16px ${pageInfo.color}30`,
              }}
            >
              {pageInfo.icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#f8fafc" letterSpacing="-0.3px" lineHeight={1.2}>
                {pageInfo.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: 11 }}>
                BioPulse Protocol • En ligne
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {/* Right Side: Structured Date & Clock Widget + Notifications Button + Admin Profile */}
        <Stack direction="row" alignItems="center" spacing={2.5}>
          {/* Structured Realtime Date & Clock Widget */}
          <Paper
            elevation={0}
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 0.8,
              borderRadius: 3,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.25)",
            }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <CalendarTodayIcon sx={{ color: "#38bdf8", fontSize: 15 }} />
              <Typography variant="caption" fontWeight={700} color="#f8fafc" fontSize={12}>
                {dateStr}
              </Typography>
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(56, 189, 248, 0.25)", height: 16, alignSelf: "center" }} />

            <Stack direction="row" alignItems="center" gap={1}>
              <AccessTimeIcon sx={{ color: "#10b981", fontSize: 16 }} />
              <Typography variant="caption" fontWeight={800} color="#34d399" fontSize={12.5} letterSpacing="0.4px">
                {clockStr}
              </Typography>
              <Chip
                label="LIVE"
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9,
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  fontWeight: 800,
                  px: 0.5,
                }}
              />
            </Stack>
          </Paper>

          {/* Wider Notifications Capsule Button with Text & Badge */}
          <Button
            onClick={handleOpenNotifications}
            startIcon={
              <Badge badgeContent={unread} color="error" sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16 } }}>
                <NotificationsIcon sx={{ fontSize: 19 }} />
              </Badge>
            }
            sx={{
              borderRadius: 3,
              px: 2.2,
              py: 0.9,
              minWidth: 145,
              backgroundColor: unread > 0 ? "rgba(2, 132, 199, 0.15)" : "rgba(30, 41, 59, 0.6)",
              color: unread > 0 ? "#38bdf8" : "#94a3b8",
              border: unread > 0 ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(56, 189, 248, 0.2)",
                color: "#f8fafc",
                borderColor: "#38bdf8",
              },
              transition: "all 0.2s ease",
            }}
          >
            <Typography variant="body2" fontWeight={700} fontSize={13} textTransform="none">
              Notifications
            </Typography>
          </Button>

          {/* Notifications Popover Cadre */}
          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={handleCloseNotifications}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                width: 360,
                maxHeight: 500,
                mt: 1.5,
                borderRadius: 3.5,
                backgroundColor: "#080d1a",
                backgroundImage: "linear-gradient(180deg, rgba(13, 20, 38, 0.98) 0%, rgba(7, 11, 22, 0.98) 100%)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                boxShadow: "0 22px 60px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
                overflow: "hidden",
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 40%, #8b5cf6 100%)",
                  boxShadow: "0 0 12px rgba(56, 189, 248, 0.5)",
                  zIndex: 10,
                },
              },
            }}
          >
            {/* Cadre Header */}
            <Box
              px={2}
              py={1.3}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                background: "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 16, 31, 0.9) 100%)",
                borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              <Stack direction="row" alignItems="center" gap={1.2}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: 1.8,
                    background: "linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(139, 92, 246, 0.25) 100%)",
                    border: "1px solid rgba(56, 189, 248, 0.5)",
                    boxShadow: "0 0 10px rgba(56, 189, 248, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#38bdf8",
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 15 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight={800} color="#f8fafc" fontSize={13} letterSpacing="-0.2px">
                  Notifications ({notifications.length})
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                {unread > 0 && (
                  <Chip
                    label={`${unread} non lue(s)`}
                    size="small"
                    sx={{
                      height: 19,
                      fontSize: 9.5,
                      fontWeight: 800,
                      backgroundColor: "rgba(2, 132, 199, 0.25)",
                      color: "#38bdf8",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                    }}
                  />
                )}
                {notifications.length > 0 && (
                  <Tooltip title="Tout effacer">
                    <IconButton
                      size="small"
                      onClick={async () => {
                        setNotifications([]);
                        setBannerMsg("Toutes les notifications ont été effacées");
                        setTimeout(() => setBannerMsg(""), 3000);
                      }}
                      sx={{ color: "#64748b", p: 0.4, "&:hover": { color: "#f87171", backgroundColor: "rgba(239, 68, 68, 0.15)" } }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Box>

            {bannerMsg && (
              <Box
                px={2}
                py={0.6}
                sx={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="caption" fontWeight={700} color="#f87171" display="flex" alignItems="center" gap={1}>
                  <DeleteIcon sx={{ fontSize: 12 }} /> {bannerMsg}
                </Typography>
                <Chip label="Info" size="small" sx={{ height: 15, fontSize: 8, backgroundColor: "rgba(239, 68, 68, 0.25)", color: "#f87171", fontWeight: 700 }} />
              </Box>
            )}

            {/* Continuous Row List avec Scrollbar personnalisée */}
            <List
              sx={{
                p: 0,
                maxHeight: 375,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { background: "rgba(15, 23, 42, 0.4)" },
                "&::-webkit-scrollbar-thumb": { background: "rgba(56, 189, 248, 0.3)", borderRadius: "4px" },
                "&::-webkit-scrollbar-thumb:hover": { background: "#38bdf8" },
              }}
            >
              {notifications.length === 0 ? (
                <Box py={4} px={2} textAlign="center">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      backgroundColor: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 1.2,
                      color: "#38bdf8",
                    }}
                  >
                    <NotificationsIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} color="#f8fafc" mb={0.2} fontSize={12}>
                    Aucune notification
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontSize={11}>
                    Tous les événements sont à jour.
                  </Typography>
                </Box>
              ) : (
                notifications.map((n) => {
                  const config = notifTypeConfig[n.type] || {
                    icon: <NotificationsIcon sx={{ fontSize: 13 }} />,
                    color: "#38bdf8",
                    label: "INFO",
                    bg: "rgba(56, 189, 248, 0.12)",
                    border: "rgba(56, 189, 248, 0.3)",
                  };

                  return (
                    <ListItem
                      key={n.id}
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        setNotifAnchor(null);
                        if (n.type === "oubli_fin_service") {
                          navigate(n.employeeId ? `/attendance?employee=${n.employeeId}` : "/attendance");
                        } else if (n.employeeId) {
                          navigate(`/employees/${n.employeeId}`);
                        }
                      }}
                      sx={{
                        px: 1.8,
                        py: 0.9,
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        borderLeft: `3px solid ${config.color}`,
                        backgroundColor: n.read ? "transparent" : "rgba(2, 132, 199, 0.08)",
                        "&:hover": {
                          backgroundColor: "rgba(56, 189, 248, 0.12)",
                        },
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <Avatar
                        src={getPhotoUrl(n.employeePhoto)}
                        sx={{
                          width: 28,
                          height: 28,
                          mr: 1.2,
                          bgcolor: "rgba(2, 132, 199, 0.2)",
                          border: `1px solid ${config.color}`,
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {n.message ? n.message[0].toUpperCase() : "N"}
                      </Avatar>

                      <Box flexGrow={1} minWidth={0}>
                        <Stack direction="row" alignItems="center" gap={0.8} mb={0.1}>
                          <Chip
                            label={config.label}
                            size="small"
                            sx={{
                              height: 15,
                              fontSize: 8,
                              fontWeight: 800,
                              backgroundColor: config.bg,
                              color: config.color,
                              border: `1px solid ${config.border}`,
                              px: 0.3,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: 9.5, fontWeight: 600 }}>
                            {n.time}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontSize: 11.5, fontWeight: 600, color: "#f8fafc", lineHeight: 1.2 }}>
                          {n.message}
                        </Typography>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteNotification(n.id, e)}
                        sx={{
                          color: "#475569",
                          p: 0.3,
                          ml: 0.5,
                          "&:hover": { color: "#f87171", backgroundColor: "rgba(239, 68, 68, 0.15)" },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </ListItem>
                  );
                })
              )}
            </List>

            {/* Cadre Footer */}
            <Box
              px={2}
              py={1}
              sx={{
                backgroundColor: "rgba(10, 16, 31, 0.95)",
                borderTop: "1px solid rgba(56, 189, 248, 0.2)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button
                size="small"
                onClick={() => {
                  setNotifAnchor(null);
                  navigate("/attendance");
                }}
                sx={{
                  color: "#38bdf8",
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: "none",
                  py: 0.3,
                  "&:hover": { backgroundColor: "rgba(56, 189, 248, 0.12)" },
                }}
              >
                Voir le registre des présences complet →
              </Button>
            </Box>
          </Popover>

          {/* Admin User Profile Avatar — opens dropdown menu with Logout */}
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              p: 0.5,
              border: "2px solid rgba(56, 189, 248, 0.35)",
              "&:hover": { borderColor: "#38bdf8" },
            }}
          >
            <Avatar
              src={getPhotoUrl(user?.photo)}
              sx={{ width: 36, height: 36, bgcolor: "#0284c7", fontSize: 14, fontWeight: 700 }}
            >
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </Avatar>
          </IconButton>

          {/* User Profile & Logout Menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                width: 220,
                mt: 1.5,
                borderRadius: 3,
                backgroundColor: "rgba(15, 23, 42, 0.96)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                color: "#f8fafc",
              },
            }}
          >
            <Box px={2} py={1.5} borderBottom="1px solid rgba(56, 189, 248, 0.15)">
              <Typography variant="subtitle2" fontWeight={800} color="#f8fafc" noWrap>
                {user?.name || "Administrateur"}
              </Typography>
              <Typography variant="caption" color="#94a3b8" noWrap display="block">
                {user?.email || "admin@biopulse.com"}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate("/profile");
              }}
              sx={{ py: 1.2, px: 2, fontSize: 14, "&:hover": { backgroundColor: "rgba(56, 189, 248, 0.15)" } }}
            >
              <ListItemIcon>
                <PersonIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
              </ListItemIcon>
              Mon Profil
            </MenuItem>
            <Divider sx={{ borderColor: "rgba(56, 189, 248, 0.15)", my: 0.5 }} />
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.2,
                px: 2,
                fontSize: 14,
                color: "#f87171",
                "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.15)" },
              }}
            >
              <ListItemIcon>
                <LogoutIcon sx={{ color: "#f87171", fontSize: 20 }} />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}