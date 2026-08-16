import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import api from "../services/api";

const fieldStyle = {
  width: "100%",
  padding: "13px 44px",
  fontSize: 14,
  color: "#f8fafc",
  backgroundColor: "rgba(30, 41, 59, 0.6)",
  border: "1.5px solid rgba(56, 189, 248, 0.2)",
  borderRadius: 12,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password || !confirm) { setError("Veuillez remplir tous les champs"); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return; }

    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess("Mot de passe réinitialisé avec succès !");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Token invalide ou expiré");
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
        p: 2,
        zoom: "normal",
      }}
    >
      {/* Ambient blobs */}
      <Box sx={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(2,132,199,0.1) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />

      <Box
        sx={{
          width: { xs: "100%", sm: 440 },
          borderRadius: "24px",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          boxShadow: "0 0 60px rgba(2, 132, 199, 0.12), 0 24px 60px rgba(0,0,0,0.6)",
          overflow: "hidden",
          position: "relative",
          zIndex: 2,
          animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          "@keyframes fadeInUp": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {/* Top brand bar */}
        <Box sx={{ px: 4, py: 2.5, background: "linear-gradient(145deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.95) 100%)", borderBottom: "1px solid rgba(56, 189, 248, 0.12)", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FingerprintIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.3px" }}>BioPulse Platform</Typography>
            <Typography sx={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, letterSpacing: "1px" }}>EMPLOYEE ATTENDANCE SYSTEM</Typography>
          </Box>
        </Box>

        {/* Form area */}
        <Box sx={{ px: 4, py: 4.5, background: "rgba(9, 13, 22, 0.92)" }}>
          {success ? (
            <Box textAlign="center">
              <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 32, color: "#34d399" }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", mb: 1 }}>Mot de passe réinitialisé !</Typography>
              <Typography sx={{ fontSize: 13.5, color: "#64748b", mb: 3 }}>
                Vous allez être redirigé vers la page de connexion...
              </Typography>
              <CircularProgress size={24} sx={{ color: "#0284c7" }} />
            </Box>
          ) : (
            <>
              <Box mb={3.5} textAlign="center">
                <Box sx={{ width: 56, height: 56, borderRadius: "14px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
                  <LockResetIcon sx={{ fontSize: 28, color: "#38bdf8" }} />
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px", mb: 0.8 }}>
                  Nouveau mot de passe
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: "#64748b" }}>
                  Choisissez un mot de passe sécurisé pour votre compte
                </Typography>
              </Box>

              {error && (
                <Box mb={2.5} px={2} py={1.5} sx={{ borderRadius: "10px", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#fb7185", fontSize: 13, fontWeight: 600 }}>
                  {error}
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                <Box display="flex" flexDirection="column" gap={2.5}>
                  {/* New password */}
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.3px", mb: 0.8 }}>
                      NOUVEAU MOT DE PASSE
                    </Typography>
                    <Box sx={{ position: "relative" }}>
                      <Box sx={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#38bdf8", display: "flex", alignItems: "center", zIndex: 1 }}>
                        <LockOutlinedIcon sx={{ fontSize: 19 }} />
                      </Box>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        required
                        style={fieldStyle}
                      />
                      <Box
                        sx={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </Box>
                    </Box>
                  </Box>

                  {/* Confirm password */}
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.3px", mb: 0.8 }}>
                      CONFIRMER LE MOT DE PASSE
                    </Typography>
                    <Box sx={{ position: "relative" }}>
                      <Box sx={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#38bdf8", display: "flex", alignItems: "center", zIndex: 1 }}>
                        <LockOutlinedIcon sx={{ fontSize: 19 }} />
                      </Box>
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                        required
                        style={{
                          ...fieldStyle,
                          borderColor: confirm && confirm !== password ? "rgba(244,63,94,0.5)" : confirm && confirm === password ? "rgba(16,185,129,0.5)" : "rgba(56, 189, 248, 0.2)",
                        }}
                      />
                      <Box
                        sx={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    disabled={loading}
                    sx={{
                      py: 1.6,
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: 15,
                      textTransform: "none",
                      background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
                      color: "#fff",
                      boxShadow: "0 6px 24px rgba(2, 132, 199, 0.4)",
                      mt: 0.5,
                      "&:hover": { background: "linear-gradient(135deg, #0369a1 0%, #4f46e5 100%)", transform: "translateY(-1px)" },
                      "&:disabled": { opacity: 0.6 },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {loading ? <CircularProgress size={22} color="inherit" /> : "Réinitialiser le mot de passe →"}
                  </Button>
                </Box>
              </form>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}