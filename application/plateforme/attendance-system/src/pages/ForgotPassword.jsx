import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, InputAdornment } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import api from "../services/api";

const FIELD_SX = {
  width: "100%",
  padding: "13px 14px 13px 44px",
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email) { setError("Veuillez saisir votre email"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess("Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi");
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
            /* Success state */
            <Box textAlign="center">
              <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                <MarkEmailReadIcon sx={{ fontSize: 32, color: "#34d399" }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", mb: 1 }}>Email envoyé !</Typography>
              <Typography sx={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7, mb: 3.5 }}>
                Consultez votre boîte mail <strong style={{ color: "#38bdf8" }}>{email}</strong> et cliquez sur le lien de réinitialisation.
              </Typography>
              <Button
                fullWidth
                onClick={() => navigate("/login")}
                sx={{ py: 1.5, borderRadius: "12px", fontWeight: 700, fontSize: 14, textTransform: "none", background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)", color: "#fff", "&:hover": { background: "linear-gradient(135deg, #0369a1 0%, #4f46e5 100%)" } }}
              >
                Retour à la connexion
              </Button>
            </Box>
          ) : (
            <>
              <Box mb={3.5}>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px", mb: 0.8 }}>
                  Mot de passe oublié ?
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6 }}>
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </Typography>
              </Box>

              {error && (
                <Box mb={2.5} px={2} py={1.5} sx={{ borderRadius: "10px", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#fb7185", fontSize: 13, fontWeight: 600 }}>
                  {error}
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                <Box mb={2.5}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.3px", mb: 0.8 }}>
                    ADRESSE EMAIL
                  </Typography>
                  <Box sx={{ position: "relative" }}>
                    <Box sx={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#38bdf8", display: "flex", alignItems: "center", zIndex: 1 }}>
                      <EmailOutlinedIcon sx={{ fontSize: 19 }} />
                    </Box>
                    <input
                      type="email"
                      placeholder="admin@biopulse.io"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      required
                      style={FIELD_SX}
                    />
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
                    "&:hover": { background: "linear-gradient(135deg, #0369a1 0%, #4f46e5 100%)", boxShadow: "0 8px 30px rgba(2, 132, 199, 0.6)", transform: "translateY(-1px)" },
                    "&:disabled": { opacity: 0.6 },
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Envoyer le lien →"}
                </Button>
              </form>

              <Box
                display="flex"
                alignItems="center"
                gap={0.8}
                mt={3}
                sx={{ cursor: "pointer", width: "fit-content", "&:hover .back-text": { color: "#38bdf8" } }}
                onClick={() => navigate("/login")}
              >
                <ArrowBackIcon sx={{ fontSize: 15, color: "#64748b" }} />
                <Typography className="back-text" sx={{ fontSize: 13, color: "#64748b", fontWeight: 600, transition: "color 0.2s" }}>
                  Retour à la connexion
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}