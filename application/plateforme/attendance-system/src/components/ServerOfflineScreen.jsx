import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Collapse,
  IconButton,
  Chip,
  Paper,
} from "@mui/material";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import TerminalIcon from "@mui/icons-material/Terminal";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import StorageIcon from "@mui/icons-material/Storage";
import { useServerStatus } from "../context/ServerStatusContext";

export default function ServerOfflineScreen() {
  const {
    isServerDown,
    isChecking,
    errorDetails,
    lastChecked,
    countdown,
    serverUrl,
    checkServerHealth,
  } = useServerStatus();

  const [showDetails, setShowDetails] = useState(false);

  if (!isServerDown) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: "radial-gradient(ellipse at 50% 20%, rgba(244, 63, 94, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(15, 23, 42, 0.95) 0%, transparent 60%), #090d16",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        overflowY: "auto",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background glowing ambient elements */}
      <Box
        sx={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: { xs: 300, sm: 500 },
          height: { xs: 300, sm: 500 },
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <Paper
        elevation={24}
        sx={{
          width: "100%",
          maxWidth: 620,
          borderRadius: "24px",
          background: "linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.92) 100%)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          boxShadow: "0 0 50px rgba(244, 63, 94, 0.2), 0 20px 40px rgba(0,0,0,0.7)",
          p: { xs: 3, sm: 4.5 },
          position: "relative",
          zIndex: 2,
          animation: "fadeInZoom 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          "@keyframes fadeInZoom": {
            from: { opacity: 0, transform: "scale(0.95) translateY(10px)" },
            to: { opacity: 1, transform: "scale(1) translateY(0)" },
          },
        }}
      >
        {/* Header Icon with pulse animation */}
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={3}>
          <Box
            sx={{
              position: "relative",
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "rgba(244, 63, 94, 0.12)",
              border: "2px solid rgba(244, 63, 94, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2.5,
              boxShadow: "0 0 30px rgba(244, 63, 94, 0.3)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: -6,
                left: -6,
                right: -6,
                bottom: -6,
                borderRadius: "50%",
                border: "1.5px dashed rgba(244, 63, 94, 0.4)",
                animation: "spinSlow 12s linear infinite",
              },
              "@keyframes spinSlow": {
                from: { transform: "rotate(0deg)" },
                to: { transform: "rotate(360deg)" },
              },
            }}
          >
            <WifiOffIcon sx={{ fontSize: 42, color: "#fb7185" }} />
          </Box>

          <Chip
            icon={<ReportProblemOutlinedIcon sx={{ fontSize: 16, color: "#fb7185" }} />}
            label="SERVEUR INACCESSIBLE"
            sx={{
              backgroundColor: "rgba(244, 63, 94, 0.15)",
              color: "#fb7185",
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: "1.2px",
              px: 1,
              py: 0.5,
              borderRadius: "8px",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              mb: 2,
            }}
          />

          <Typography
            sx={{
              fontSize: { xs: 22, sm: 26 },
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: "-0.5px",
              lineHeight: 1.25,
              mb: 1.5,
            }}
          >
            Impossible de contacter le serveur
          </Typography>

          <Typography
            sx={{
              fontSize: 14,
              color: "#94a3b8",
              lineHeight: 1.6,
              maxWidth: 480,
            }}
          >
            L'application BioPulse ne parvient pas à établir la connexion avec le serveur backend. Veuillez vérifier que le serveur est démarré et accessible.
          </Typography>
        </Box>

        {/* Server status indicator box */}
        <Box
          sx={{
            p: 2,
            borderRadius: "14px",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(56, 189, 248, 0.12)",
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StorageIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>
                ADRESSE DU SERVEUR
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", fontFamily: "monospace" }}>
                {serverUrl}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#f43f5e",
                boxShadow: "0 0 10px #f43f5e",
                animation: "pulseRed 1.5s infinite alternate",
                "@keyframes pulseRed": {
                  from: { opacity: 0.4 },
                  to: { opacity: 1 },
                },
              }}
            />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#fb7185" }}>
              Hors Ligne
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Stack spacing={2} mb={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => checkServerHealth(false)}
            disabled={isChecking}
            startIcon={isChecking ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            sx={{
              py: 1.6,
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: 15,
              textTransform: "none",
              background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
              boxShadow: "0 6px 20px rgba(2, 132, 199, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #0369a1 0%, #4f46e5 100%)",
                boxShadow: "0 8px 25px rgba(2, 132, 199, 0.6)",
                transform: "translateY(-1px)",
              },
              "&:disabled": { opacity: 0.7 },
              transition: "all 0.2s ease",
            }}
          >
            {isChecking ? "Vérification en cours..." : "Réessayer la connexion"}
          </Button>

          <Box textAlign="center">
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
              Nouvelle tentative automatique dans{" "}
              <strong style={{ color: "#38bdf8", fontWeight: 700 }}>{countdown}s</strong>
            </Typography>
          </Box>
        </Stack>

        {/* Technical Details Toggle */}
        <Box sx={{ borderTop: "1px solid rgba(56, 189, 248, 0.1)", pt: 2 }}>
          <Button
            fullWidth
            onClick={() => setShowDetails(!showDetails)}
            endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            startIcon={<TerminalIcon sx={{ fontSize: 18, color: "#38bdf8" }} />}
            sx={{
              justifyContent: "space-between",
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 600,
              px: 1,
              py: 0.8,
              "&:hover": { color: "#f8fafc", backgroundColor: "rgba(255, 255, 255, 0.03)" },
            }}
          >
            Détails techniques du diagnostic
          </Button>

          <Collapse in={showDetails}>
            <Box
              sx={{
                mt: 1.5,
                p: 2,
                borderRadius: "10px",
                backgroundColor: "#060911",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                fontFamily: "'Fira Code', 'Consolas', monospace",
                fontSize: 12,
                color: "#e2e8f0",
                lineHeight: 1.6,
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              <Typography variant="caption" sx={{ color: "#38bdf8", display: "block", mb: 0.8, fontWeight: 700 }}>
                === JOURNAL D'ERREUR DU SERVEUR ===
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 0.5 }}>
                • Horodatage: {lastChecked ? lastChecked.toLocaleString() : "N/A"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 1 }}>
                • Endpoint testé: {serverUrl}/api/health
              </Typography>
              <Box
                sx={{
                  color: "#fb7185",
                  wordBreak: "break-all",
                  backgroundColor: "rgba(244, 63, 94, 0.1)",
                  p: 1,
                  borderRadius: "6px",
                  borderLeft: "3px solid #f43f5e",
                }}
              >
                {errorDetails || "Aucun détail technique disponible pour l'instant."}
              </Box>

              <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 1.5 }}>
                Conseil administrateur : Vérifiez dans le terminal du serveur que la commande <code>npm run dev</code> ou <code>node server.js</code> est active sur le port 5000.
              </Typography>
            </Box>
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
}
