import { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, Chip } from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import SensorsIcon from "@mui/icons-material/Sensors";

export default function FingerprintScanner({
  onScanSuccess,
  title = "Biometric Verification Terminal",
  subtitle = "Place registered finger on sensor to authenticate",
  compact = false,
}) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'scanning' | 'success' | 'error'
  const [matchScore, setMatchScore] = useState(null);

  const triggerScan = () => {
    if (scanning) return;
    setScanning(true);
    setStatus("scanning");
    setMatchScore(null);

    setTimeout(() => {
      // 95% simulated success rate
      const isOk = Math.random() > 0.05;
      if (isOk) {
        const score = (98 + Math.random() * 1.9).toFixed(1);
        setStatus("success");
        setMatchScore(score);
        if (onScanSuccess) {
          onScanSuccess({ score, timestamp: new Date().toLocaleTimeString() });
        }
      } else {
        setStatus("error");
      }
      setScanning(false);
    }, 1800);
  };

  return (
    <Paper
      elevation={0}
      className={status === "success" ? "glass-panel-glow" : "glass-panel"}
      sx={{
        p: compact ? 2.5 : 4,
        borderRadius: 4,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))",
        transition: "all 0.3s ease",
      }}
    >
      {/* Decorative Top Accent Light */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "2px",
          background:
            status === "success"
              ? "linear-gradient(90deg, transparent, #10b981, transparent)"
              : status === "error"
              ? "linear-gradient(90deg, transparent, #ef4444, transparent)"
              : "linear-gradient(90deg, transparent, #06b6d4, transparent)",
          boxShadow:
            status === "success"
              ? "0 0 10px #10b981"
              : status === "error"
              ? "0 0 10px #ef4444"
              : "0 0 10px #06b6d4",
        }}
      />

      {/* Header Badge */}
      <Box display="flex" justifyContent="center" mb={compact ? 1.5 : 2.5}>
        <Chip
          icon={<SensorsIcon style={{ color: status === "success" ? "#10b981" : "#06b6d4" }} />}
          label={status === "scanning" ? "Scanning Biometrics..." : "Terminal #01 • BioPulse Sensor Ready"}
          size="small"
          sx={{
            backgroundColor: "rgba(6, 182, 212, 0.1)",
            color: "#38bdf8",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      </Box>

      {/* Interactive Fingerprint Scanner Glass Box */}
      <Box
        onClick={triggerScan}
        sx={{
          width: compact ? 110 : 150,
          height: compact ? 110 : 150,
          mx: "auto",
          mb: 2.5,
          borderRadius: "50%",
          border:
            status === "success"
              ? "3px solid #10b981"
              : status === "error"
              ? "3px solid #ef4444"
              : "3px solid rgba(6, 182, 212, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: scanning ? "wait" : "pointer",
          position: "relative",
          background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0.9) 70%)",
          boxShadow:
            status === "success"
              ? "0 0 30px rgba(16, 185, 129, 0.5)"
              : status === "error"
              ? "0 0 30px rgba(239, 68, 68, 0.5)"
              : "0 0 25px rgba(6, 182, 212, 0.3)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: scanning ? "none" : "scale(1.04)",
            borderColor: "#38bdf8",
            boxShadow: "0 0 35px rgba(6, 182, 212, 0.6)",
          },
        }}
      >
        {/* Animated Laser Scanning Beam when scanning */}
        {scanning && <Box className="laser-line" />}

        {/* Pulsing Scanner Rings */}
        <Box
          className={scanning ? "pulse-biometric" : ""}
          sx={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: "1px dashed rgba(56, 189, 248, 0.4)",
            pointerEvents: "none",
          }}
        />

        {/* Center Icon */}
        {status === "success" ? (
          <CheckCircleOutlinedIcon sx={{ fontSize: compact ? 56 : 72, color: "#10b981" }} />
        ) : status === "error" ? (
          <ErrorOutlinedIcon sx={{ fontSize: compact ? 56 : 72, color: "#ef4444" }} />
        ) : (
          <FingerprintIcon
            className={scanning ? "neon-fingerprint" : ""}
            sx={{
              fontSize: compact ? 64 : 84,
              color: scanning ? "#38bdf8" : "#06b6d4",
              transition: "all 0.3s ease",
            }}
          />
        )}
      </Box>

      {/* Main Labels */}
      {!compact && (
        <>
          <Typography variant="h6" fontWeight={700} color="#f8fafc" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="#94a3b8" mb={2}>
            {subtitle}
          </Typography>
        </>
      )}

      {/* Dynamic Status Display */}
      {status === "success" && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            ✓ BIOMETRIC MATCH CONFIRMED ({matchScore}%)
          </Typography>
          <Typography variant="caption" sx={{ color: "#a7f3d0" }}>
            Identity Verified • Attendance Recorded
          </Typography>
        </Box>
      )}

      {status === "error" && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            ✕ BIOMETRIC SCAN FAILED
          </Typography>
          <Typography variant="caption" sx={{ color: "#fca5a5" }}>
            Please reposition finger and scan again
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={triggerScan}
        disabled={scanning}
        startIcon={<FingerprintIcon />}
        sx={{
          borderRadius: 3,
          px: 3,
          py: 1.2,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "none",
          background: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
          boxShadow: "0 4px 20px rgba(6, 182, 212, 0.4)",
          "&:hover": {
            background: "linear-gradient(135deg, #0891b2 0%, #1d4ed8 100%)",
            boxShadow: "0 6px 25px rgba(6, 182, 212, 0.6)",
          },
        }}
      >
        {scanning ? "Scanning Fingerprint..." : "Scan Fingerprint"}
      </Button>
    </Paper>
  );
}
