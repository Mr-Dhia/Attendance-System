import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Switch, Stack, TextField,
  Divider, Alert, CircularProgress, Chip, Paper, Grid,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import LockClockIcon from "@mui/icons-material/LockClock";
import { getWorkSchedule, updateWorkSchedule } from "../services/schedule.service";

export default function ScheduleModal({ open, onClose, employeeId = null, employeeName = "" }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [jours, setJours] = useState([]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      setSuccess("");
      getWorkSchedule(employeeId)
        .then((data) => {
          setJours(data.jours || []);
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Erreur lors du chargement des horaires");
        })
        .finally(() => setLoading(false));
    }
  }, [open, employeeId]);

  const handleDayChange = (index, field, value) => {
    setJours((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateWorkSchedule({ employeeId, jours });
      setSuccess("Horaires hebdomadaires enregistrés avec succès !");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          color: "#f8fafc",
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 15px rgba(2, 132, 199, 0.4)",
            }}
          >
            <LockClockIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#f8fafc">
              Horaires Hebdomadaires {employeeName ? `• ${employeeName}` : "Globaux"}
            </Typography>
            <Typography variant="caption" color="#94a3b8">
              Configuration des plages de service & pointage contrôlé
            </Typography>
          </Box>
        </Stack>

        <Chip
          label="Pointage Contrôlé Actif"
          color="success"
          size="small"
          sx={{ fontWeight: 700, px: 1 }}
        />
      </DialogTitle>

      <Divider sx={{ borderColor: "rgba(56, 189, 248, 0.15)" }} />

      <DialogContent sx={{ p: 3 }}>
        {/* Controlled Punch Rule Explainer Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            backgroundColor: "rgba(2, 132, 199, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <InfoIcon sx={{ color: "#38bdf8", mt: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#38bdf8">
                Règles Automatiques de Contrôle du Pointage :
              </Typography>
              <Typography variant="caption" color="#cbd5e1" display="block" mt={0.5}>
                1. <strong>Entrée</strong> : Autorisée au plus tôt <strong>10 minutes avant</strong> l'heure de début de service configurée (ex: pas avant 07:50 pour 08:00).
              </Typography>
              <Typography variant="caption" color="#cbd5e1" display="block" mt={0.3}>
                2. <strong>Sortie</strong> : Autorisée au plus tôt <strong>1 heure après</strong> le pointage d'entrée.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {success && (
          <Alert severity="success" sx={{ mb: 2.5, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Stack spacing={2}>
            {jours.map((day, idx) => (
              <Paper
                key={day.nomJour}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: day.estJourOuvre ? "rgba(30, 41, 59, 0.6)" : "rgba(15, 23, 42, 0.4)",
                  border: day.estJourOuvre
                    ? "1px solid rgba(56, 189, 248, 0.2)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                {/* Day Name & Working Day Toggle */}
                <Stack direction="row" alignItems="center" gap={2} minWidth={160}>
                  <Switch
                    checked={day.estJourOuvre}
                    onChange={(e) => handleDayChange(idx, "estJourOuvre", e.target.checked)}
                    color="primary"
                  />
                  <Box>
                    <Typography variant="body1" fontWeight={700} color={day.estJourOuvre ? "#f8fafc" : "#64748b"}>
                      {day.nomJour}
                    </Typography>
                    <Typography variant="caption" color={day.estJourOuvre ? "#34d399" : "#64748b"}>
                      {day.estJourOuvre ? "Affecté" : "Non affecté"}
                    </Typography>
                  </Box>
                </Stack>

                {/* Time Inputs */}
                {day.estJourOuvre ? (
                  <Stack direction="row" alignItems="center" gap={2}>
                    <TextField
                      label="Heure Début"
                      type="time"
                      size="small"
                      value={day.heureDebut || "08:00"}
                      onChange={(e) => handleDayChange(idx, "heureDebut", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      sx={{ width: 140 }}
                    />
                    <Typography variant="body2" color="#64748b">à</Typography>
                    <TextField
                      label="Heure Fin"
                      type="time"
                      size="small"
                      value={day.heureFin || "17:00"}
                      onChange={(e) => handleDayChange(idx, "heureFin", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      sx={{ width: 140 }}
                    />
                  </Stack>
                ) : (
                  <Typography variant="caption" color="#64748b" fontStyle="italic" pr={4}>
                    Aucun service configuré
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: "rgba(56, 189, 248, 0.15)" }} />

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />} sx={{ color: "#94a3b8", textTransform: "none" }}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 700,
            background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
            boxShadow: "0 4px 15px rgba(2, 132, 199, 0.4)",
          }}
        >
          {saving ? "Enregistrement..." : "Enregistrer les Horaires"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
