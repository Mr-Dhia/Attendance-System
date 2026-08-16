import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircularProgress, Box, Typography, Button,
  TextField, InputAdornment, IconButton, Stack, Divider,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SecurityIcon from "@mui/icons-material/Security";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import { login, verifyOTP } from "../services/auth.service";

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    color: "#f8fafc",
    "& fieldset": { borderColor: "rgba(56, 189, 248, 0.2)" },
    "&:hover fieldset": { borderColor: "#0284c7" },
    "&.Mui-focused fieldset": { borderColor: "#0284c7" },
  },
  "& .MuiInputBase-input": { padding: "13px 14px", fontSize: 14, color: "#f8fafc" },
  "& .MuiInputBase-input::placeholder": { color: "#64748b" },
  mb: 0,
  mt: 0,
  width: "100%",
};

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(email, password);
      if (res.requireOTP) {
        setStep(2);
        setResendTimer(60);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Veuillez saisir le code à 6 chiffres"); return; }
    setLoading(true);
    setError("");
    try {
      await verifyOTP(email, code);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        fontFamily: "'Inter', sans-serif",
        background: "radial-gradient(ellipse at 30% 20%, rgba(2,132,199,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.1) 0%, transparent 50%), #090d16",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        position: "relative",
        overflow: "hidden",
        // Reset zoom that biometric.css applies globally
        zoom: "normal",
        fontSize: "16px",
      }}
    >
      {/* Ambient blobs */}
      <Box sx={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(2,132,199,0.1) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />

      {/* Main Card */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: { xs: "100%", sm: 500, md: 900 },
          maxWidth: 900,
          minHeight: { md: 560 },
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          boxShadow: "0 0 60px rgba(2, 132, 199, 0.15), 0 24px 60px rgba(0,0,0,0.6)",
          position: "relative",
          zIndex: 2,
          animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          "@keyframes fadeInUp": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {/* ─── Left Panel ─── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 4, md: 5 },
            background: "linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.92) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: { md: "1px solid rgba(56, 189, 248, 0.15)" },
            borderBottom: { xs: "1px solid rgba(56, 189, 248, 0.15)", md: "none" },
          }}
        >
          {/* Brand */}
          <Box display="flex" alignItems="center" gap={1.8}>
            <Box sx={{ width: 46, height: 46, borderRadius: "12px", background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(2,132,199,0.45)" }}>
              <FingerprintIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                BioPulse Platform
              </Typography>
              <Typography sx={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, letterSpacing: "1.5px" }}>
                EMPLOYEE ATTENDANCE SYSTEM
              </Typography>
            </Box>
          </Box>

          {/* Headline */}
          <Box my={4}>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.8px", lineHeight: 1.2, mb: 1.5 }}>
              Gestion Intelligente<br />du Personnel
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.65, mb: 3.5 }}>
              Une plateforme moderne et sécurisée pour le suivi en temps réel des présences, des retards et des performances de vos équipes.
            </Typography>

            <Stack gap={4}>
              {[
                { icon: <CheckCircleOutlineIcon sx={{ color: "#34d399", fontSize: 20 }} />, bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", title: "Suivi Automatisé", sub: "Pointage fluide et synchronisation instantanée" },
                { icon: <AssessmentOutlinedIcon sx={{ color: "#38bdf8", fontSize: 20 }} />, bg: "rgba(2,132,199,0.12)", border: "rgba(56,189,248,0.25)", title: "Rapports & Statistiques", sub: "Tableaux de bord analytiques détaillés" },
                { icon: <ShieldOutlinedIcon sx={{ color: "#a5b4fc", fontSize: 20 }} />, bg: "rgba(99,102,241,0.12)", border: "rgba(165,180,252,0.25)", title: "Sécurité Entreprise", sub: "Authentification 2FA & contrôle d'accès strict" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: "10px", backgroundColor: item.bg, border: `1px solid ${item.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: "2px" }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#f8fafc", lineHeight: 1.4, mb: 0.5 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                      {item.sub}
                    </Typography>
                  </Box>
                </div>
              ))}
            </Stack>
          </Box>

          <Typography sx={{ fontSize: 11, color: "#334155" }}>
            © 2026 BioPulse Systems • Tous droits réservés
          </Typography>
        </Box>

        {/* ─── Right Panel ─── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 4, md: 5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "rgba(9, 13, 22, 0.9)",
          }}
        >
          {step === 1 ? (
            <>
              {/* Header */}
              <Box mb={3.5}>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px", mb: 0.5 }}>
                  Bienvenue
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: "#64748b" }}>
                  Connectez-vous pour accéder à votre espace de gestion
                </Typography>
              </Box>

              {/* Error */}
              {error && (
                <Box mb={2.5} px={2} py={1.5} sx={{ borderRadius: "10px", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#fb7185", fontSize: 13, fontWeight: 600 }}>
                  {error}
                </Box>
              )}

              <form onSubmit={handleLoginSubmit}>
                <Stack gap={2.5}>
                  {/* Email */}
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", mb: 0.8, letterSpacing: "0.3px" }}>
                      ADRESSE EMAIL
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="admin@biopulse.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      sx={FIELD_SX}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlinedIcon sx={{ color: "#38bdf8", fontSize: 19 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Password */}
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.3px", mb: 0.8 }}>
                      MOT DE PASSE
                    </Typography>
                    <TextField
                      fullWidth
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      sx={FIELD_SX}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ color: "#38bdf8", fontSize: 19 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: "#64748b" }}>
                              {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Typography
                      sx={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, cursor: "pointer", mt: 1, display: "inline-block", "&:hover": { textDecoration: "underline" } }}
                      onClick={() => navigate("/forgot-password")}
                    >
                      Mot de passe oublié ?
                    </Typography>
                  </Box>

                  {/* Submit */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: 1.6,
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: 15,
                      textTransform: "none",
                      background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
                      boxShadow: "0 6px 24px rgba(2, 132, 199, 0.4)",
                      mt: 0.5,
                      "&:hover": {
                        background: "linear-gradient(135deg, #0369a1 0%, #4f46e5 100%)",
                        boxShadow: "0 8px 30px rgba(2, 132, 199, 0.6)",
                        transform: "translateY(-1px)",
                      },
                      "&:disabled": { opacity: 0.6 },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {loading ? <CircularProgress size={22} color="inherit" /> : "Se Connecter →"}
                  </Button>
                </Stack>
              </form>
            </>
          ) : (
            /* OTP Step */
            <Box textAlign="center">
              <Box sx={{ width: 60, height: 60, borderRadius: "16px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
                <SecurityIcon sx={{ fontSize: 30, color: "#38bdf8" }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", mb: 0.8 }}>
                Vérification 2FA
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: "#64748b", mb: 3.5, lineHeight: 1.6 }}>
                Entrez le code à 6 chiffres envoyé à<br />
                <strong style={{ color: "#38bdf8" }}>{email}</strong>
              </Typography>

              {error && (
                <Box mb={2.5} px={2} py={1.5} sx={{ borderRadius: "10px", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#fb7185", fontSize: 13, fontWeight: 600 }}>
                  {error}
                </Box>
              )}

              <form onSubmit={handleOtpSubmit}>
                <Box display="flex" justifyContent="center" gap={1.2} mb={3.5}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={{
                        width: 46,
                        height: 52,
                        textAlign: "center",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#f8fafc",
                        backgroundColor: "rgba(30, 41, 59, 0.7)",
                        border: `1.5px solid ${digit ? "#0284c7" : "rgba(56,189,248,0.25)"}`,
                        borderRadius: 10,
                        outline: "none",
                        fontFamily: "inherit",
                        transition: "border-color 0.2s",
                      }}
                    />
                  ))}
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.6,
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: 15,
                    textTransform: "none",
                    background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
                    boxShadow: "0 6px 24px rgba(2, 132, 199, 0.4)",
                    "&:hover": { background: "linear-gradient(135deg, #0369a1 0%, #4f46e5 100%)" },
                  }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Valider le Code"}
                </Button>

                <Typography
                  onClick={() => setStep(1)}
                  sx={{ mt: 2.5, fontSize: 13, color: "#38bdf8", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                >
                  ← Retour à la connexion
                </Typography>
              </form>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}