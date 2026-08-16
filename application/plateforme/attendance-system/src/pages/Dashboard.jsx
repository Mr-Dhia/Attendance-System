import { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Chip, CircularProgress,
  Alert, Grid, Avatar, Stack, Divider, Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import SensorsIcon from "@mui/icons-material/Sensors";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getStats, getWeekData, getRecentLogs } from "../services/dashboard.service";

const statusColorMap = {
  "À l'heure": { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" },
  "Retard": { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
  "Absent": { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
};

function BioStatCard({ label, value, sub, color, icon, gradient }) {
  return (
    <Paper
      elevation={0}
      className="glass-panel"
      sx={{
        p: 4,
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${color}40`,
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 12px 35px ${color}35`,
          borderColor: color,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 600, mb: 1.5 }}>
            {label}
          </Typography>
          <Typography variant="h3" fontWeight={800} color="#f8fafc" letterSpacing="-1px">
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: color, fontWeight: 700, mt: 1.5, display: "block" }}>
            {sub}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: 3.5,
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 6px 20px ${color}40`,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, w, l] = await Promise.all([getStats(), getWeekData(), getRecentLogs()]);
        setStats(s);
        setWeekData(w);
        setLogs(l);
      } catch {
        setError("Erreur lors du chargement des données biométriques");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: "#06b6d4" }} />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", mb: 4 }}>
        {error}
      </Alert>
    );

  const statCards = [
    {
      label: "Total Employés Enrôlés",
      value: stats.totalEmployees || 0,
      sub: `+${stats.newEmployees || 0} ce mois-ci • 100% Empreintes`,
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
      icon: <FingerprintIcon sx={{ color: "white" }} />,
    },
    {
      label: "Présences Biométriques",
      value: stats.presentToday || 0,
      sub: `${
        stats.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0
      }% du personnel identifié`,
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      icon: <VerifiedUserIcon sx={{ color: "white" }} />,
    },
    {
      label: "Retards Détectés",
      value: stats.retardsToday || 0,
      sub: `${stats.retardsToday - stats.retardsHier >= 0 ? "+" : ""}${
        stats.retardsToday - stats.retardsHier
      } vs hier`,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      icon: <AccessTimeIcon sx={{ color: "white" }} />,
    },
    {
      label: "Absences Non Identifiées",
      value: stats.absentsToday || 0,
      sub: `Non justifiées: ${stats.absentsToday || 0}`,
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      icon: <CancelIcon sx={{ color: "white" }} />,
    },
  ];

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{ width: "100%", minHeight: "calc(100vh - 120px)", flexGrow: 1, gap: 3.5 }}
      className="animate-fade-in"
    >
      {/* Top Hero Command Center Banner */}
      <Paper
        elevation={0}
        className="glass-panel-glow"
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(6, 9, 19, 0.95) 0%, rgba(2, 132, 199, 0.22) 50%, rgba(124, 58, 237, 0.2) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          boxShadow: "0 0 35px rgba(2, 132, 199, 0.25), 0 16px 44px rgba(0, 0, 0, 0.6)",
        }}
      >
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={3}>
          <Box>
            <Stack direction="row" alignItems="center" gap={2} mb={2}>
              <Chip
                icon={<SensorsIcon style={{ color: "#10b981" }} />}
                label="SYSTEM STATUS: ALL SENSORS OPERATIONAL"
                size="small"
                sx={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  py: 0.5,
                  px: 1,
                }}
              />
            </Stack>
            <Typography variant="h4" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px" mb={1}>
              Centre de Contrôle Biométrique
            </Typography>
            <Typography variant="body2" color="#94a3b8">
              Surveillance en temps réel des pointages d'empreintes digitales et gestion du personnel
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stat Cards Section */}
      <Box sx={{ width: "100%" }}>
        <Grid container spacing={3}>
          {statCards.map((s) => (
            <Grid item xs={12} sm={6} md={3} key={s.label}>
              <BioStatCard {...s} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Graphique + Derniers Pointages Section */}
      <Box sx={{ width: "100%", flexGrow: 1, display: "flex", minHeight: 460 }}>
        <Grid container spacing={3} alignItems="stretch" sx={{ flexGrow: 1 }}>
          {/* Graphique Présences */}
          <Grid item xs={12} md={7.5} lg={8} sx={{ display: "flex", flexDirection: "column" }}>
            <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 3, md: 4.5 }, borderRadius: 4, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#f8fafc" mb={0.5}>
                    Statistiques de Présence Biométrique
                  </Typography>
                  <Typography variant="body2" color="#94a3b8">
                    Répartition des scans d'empreintes validés sur 7 jours
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ width: "100%", height: 380, flexGrow: 1, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData} barSize={26} barGap={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#94a3b8", fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#94a3b8", fontWeight: 600 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        borderRadius: 12,
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        color: "#fff",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 18, color: "#94a3b8" }} />
                    <Bar dataKey="Présents" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Retards" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Absents" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Derniers Pointages Biométriques */}
          <Grid item xs={12} md={4.5} lg={4} sx={{ display: "flex", flexDirection: "column" }}>
            <Paper elevation={0} className="glass-panel" sx={{ p: { xs: 3, md: 4.5 }, borderRadius: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={800} color="#f8fafc">
                  Scans Récents
                </Typography>
                <FingerprintIcon sx={{ color: "#06b6d4", fontSize: 26 }} />
              </Box>
              <Typography variant="body2" color="#94a3b8" display="block" mb={2.5}>
                Flux d'authentification biométrique en direct
              </Typography>
              <Divider sx={{ mb: 3, borderColor: "rgba(56, 189, 248, 0.15)" }} />

              {logs.length === 0 ? (
                <Box textAlign="center" py={5} sx={{ my: "auto" }}>
                  <Typography variant="body2" color="#64748b">
                    Aucun scan enregistré aujourd'hui
                  </Typography>
                </Box>
              ) : (
                <Stack gap={2.8} sx={{ my: "auto" }}>
                  {logs.map((log, i) => {
                    const style = statusColorMap[log.status] || statusColorMap["À l'heure"];
                    return (
                      <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              fontSize: 16,
                              fontWeight: 700,
                              bgcolor: "rgba(6, 182, 212, 0.15)",
                              color: "#38bdf8",
                              border: "1px solid rgba(6, 182, 212, 0.3)",
                            }}
                          >
                            {log.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="#f8fafc">
                              {log.name}
                            </Typography>
                            <Typography variant="caption" color="#94a3b8" mt={0.3} display="block">
                              {log.time} • Empreinte #0{i + 1}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={log.status}
                          size="small"
                          sx={{
                            backgroundColor: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`,
                            fontWeight: 700,
                            fontSize: 11.5,
                            py: 0.6,
                            px: 1.2,
                          }}
                        />
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}