import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, Switch, Stack, TextField,
  Divider, Alert, CircularProgress, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, IconButton,
  FormControlLabel,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LockClockIcon from "@mui/icons-material/LockClock";
import {
  getAllSchedules, createSchedule, updateSchedule, deleteSchedule,
} from "../services/schedule.service";

export default function Schedules() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Modal création/édition d'horaire
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const schedList = await getAllSchedules();
      setSchedules(schedList);

      if (schedList.length > 0) {
        const current = selectedSchedule
          ? schedList.find((s) => s._id === selectedSchedule._id) || schedList[0]
          : schedList[0];
        handleSelectSchedule(current);
      }
    } catch {
      setError("Erreur lors du chargement des données d'horaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [bulkStartTime, setBulkStartTime] = useState("08:00");
  const [bulkEndTime, setBulkEndTime] = useState("17:00");
  const [bulkStartScan, setBulkStartScan] = useState("07:30");
  const [bulkEndScan, setBulkEndScan] = useState("18:00");
  const [bulkStartBreak, setBulkStartBreak] = useState("12:00");
  const [bulkEndBreak, setBulkEndBreak] = useState("13:00");
  const [bulkToleranceEntry, setBulkToleranceEntry] = useState(5);
  const [bulkToleranceBreak, setBulkToleranceBreak] = useState(5);
  const [bulkCigaretteMax, setBulkCigaretteMax] = useState(10);
  const [bulkMargeFinService, setBulkMargeFinService] = useState(35);
  const [bulkDelaiNotifOubli, setBulkDelaiNotifOubli] = useState(15);

  const handleSelectSchedule = (sched) => {
    if (!sched) return;
    setSelectedSchedule(sched);
    setError("");
    setSuccess("");

    if (sched.jours && sched.jours.length > 0) {
      const dayOne = sched.jours.find((d) => d.estJourOuvre) || sched.jours[0];
      if (dayOne) {
        setBulkStartTime(dayOne.heureDebut || "08:00");
        setBulkEndTime(dayOne.heureFin || "17:00");
        setBulkStartScan(dayOne.heureDebutPointage || "07:30");
        setBulkEndScan(dayOne.heureFinPointage || "18:00");
        setBulkStartBreak(dayOne.heureDebutPause || "12:00");
        setBulkEndBreak(dayOne.heureFinPause || "13:00");
        setBulkToleranceEntry(dayOne.tolerenceRetardEntree !== undefined ? dayOne.tolerenceRetardEntree : 5);
        setBulkToleranceBreak(dayOne.tolerenceRetardPause !== undefined ? dayOne.tolerenceRetardPause : 5);
        setBulkCigaretteMax(dayOne.dureePauseCigaretteMax !== undefined ? dayOne.dureePauseCigaretteMax : 10);
        setBulkMargeFinService(dayOne.margeFinService !== undefined ? dayOne.margeFinService : 35);
        setBulkDelaiNotifOubli(dayOne.delaiNotificationOubliFinService !== undefined ? dayOne.delaiNotificationOubliFinService : 15);
      }
    }
  };

  const handleDayChange = (index, field, value) => {
    if (!selectedSchedule) return;
    const updatedJours = selectedSchedule.jours.map((day, i) =>
      i === index ? { ...day, [field]: value } : day
    );
    setSelectedSchedule({ ...selectedSchedule, jours: updatedJours });
  };

  const handleApplyToAllDays = () => {
    if (!selectedSchedule) return;
    const updatedJours = selectedSchedule.jours.map((day) => ({
      ...day,
      heureDebut: bulkStartTime,
      heureFin: bulkEndTime,
      heureDebutPointage: bulkStartScan,
      heureFinPointage: bulkEndScan,
      heureDebutPause: bulkStartBreak,
      heureFinPause: bulkEndBreak,
      tolerenceRetardEntree: Number(bulkToleranceEntry) || 5,
      tolerenceRetardPause: Number(bulkToleranceBreak) || 5,
      dureePauseCigaretteMax: Number(bulkCigaretteMax) || 10,
      margeFinService: Number(bulkMargeFinService) || 35,
      delaiNotificationOubliFinService: Number(bulkDelaiNotifOubli) || 15,
    }));
    setSelectedSchedule({ ...selectedSchedule, jours: updatedJours });
    setSuccess(`Heures appliquées à tous les jours de "${selectedSchedule.nom}" !`);
    setTimeout(() => setSuccess(""), 3500);
  };

  const handleSaveScheduleTimes = async () => {
    if (!selectedSchedule) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateSchedule(selectedSchedule._id, {
        nom: selectedSchedule.nom,
        description: selectedSchedule.description,
        jours: selectedSchedule.jours,
      });
      setSuccess(`Plages d'heures enregistrées avec succès pour "${updated.nom}" !`);
      
      setSchedules((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      handleSelectSchedule(updated);

      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde des heures");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setModalTitle("");
    setModalDesc("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (sched, e) => {
    e.stopPropagation();
    setEditingId(sched._id);
    setModalTitle(sched.nom);
    setModalDesc(sched.description || "");
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!modalTitle.trim()) {
      setError("Le nom de l'horaire est obligatoire");
      return;
    }
    try {
      if (editingId) {
        await updateSchedule(editingId, { nom: modalTitle, description: modalDesc });
        setSuccess("Horaire modifié avec succès");
      } else {
        await createSchedule({ nom: modalTitle, description: modalDesc });
        setSuccess("Nouvel horaire créé avec succès");
      }
      setModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de l'horaire");
    }
  };

  const handleDeleteSchedule = async (sched, e) => {
    e.stopPropagation();
    if (window.confirm(`Voulez-vous supprimer l'horaire "${sched.nom}" ?`)) {
      try {
        await deleteSchedule(sched._id);
        setSelectedSchedule(null);
        setSuccess(`Horaire "${sched.nom}" supprimé.`);
        loadData();
        setTimeout(() => setSuccess(""), 3500);
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de supprimer cet horaire");
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress sx={{ color: "#06b6d4" }} />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={4} className="animate-fade-in" py={2}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        className="glass-panel-glow"
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background: "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.85))",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={3} width="100%">
          <Box flexGrow={1}>
            <Typography variant="h4" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px" mb={1}>
              Gestion des Régimes d'Horaires
            </Typography>
            <Typography variant="body2" color="#94a3b8">
              Créez, modifiez et configurez les créneaux d'heures de travail par équipe
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ ml: "auto" }}>
            <Button
              variant="outlined"
              startIcon={<GroupAddIcon />}
              onClick={() => navigate("/schedules/assignments")}
              sx={{
                borderRadius: 3.5,
                px: 3,
                py: 1.3,
                fontWeight: 800,
                color: "#38bdf8",
                borderColor: "rgba(56, 189, 248, 0.4)",
                "&:hover": { borderColor: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.1)" },
              }}
            >
              Affectation des Employés →
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateModal}
              sx={{
                borderRadius: 3.5,
                px: 3.5,
                py: 1.3,
                fontWeight: 800,
                textTransform: "none",
                background: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
                boxShadow: "0 6px 20px rgba(6, 182, 212, 0.4)",
              }}
            >
              Nouveau Régime d'Horaire
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399" }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3.5} sx={{ width: "100%", m: 0 }}>
        {/* Liste des régimes d'horaires (Horizontale Pleine Largeur) */}
        <Grid item xs={12} sx={{ width: "100%", p: "0 !important" }}>
          <Paper className="glass-panel" sx={{ p: 3.5, borderRadius: 5, width: "100%", boxSizing: "border-box" }}>
            <Typography variant="h6" fontWeight={800} color="#f8fafc" mb={0.5}>
              Régimes Configurés ({schedules.length})
            </Typography>
            <Typography variant="caption" color="#94a3b8" display="block" mb={2.5}>
              Cliquez sur un régime d'horaire pour afficher et modifier ses plages horaires quotidiennes
            </Typography>
            <Divider sx={{ mb: 3, borderColor: "rgba(56, 189, 248, 0.15)" }} />

            <Grid container spacing={2.5} sx={{ width: "100%", m: 0 }}>
              {schedules.map((sched) => {
                const isSelected = selectedSchedule && selectedSchedule._id === sched._id;
                return (
                  <Grid item xs={12} sm={6} md={4} key={sched._id}>
                    <Paper
                      onClick={() => handleSelectSchedule(sched)}
                      sx={{
                        p: 2.5,
                        borderRadius: 4,
                        cursor: "pointer",
                        width: "100%",
                        backgroundColor: isSelected ? "rgba(2, 132, 199, 0.22)" : "rgba(30, 41, 59, 0.5)",
                        border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(56, 189, 248, 0.15)",
                        boxShadow: isSelected ? "0 4px 20px rgba(2, 132, 199, 0.35)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#38bdf8", transform: "translateY(-2px)" },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <LockClockIcon sx={{ color: isSelected ? "#38bdf8" : "#94a3b8", fontSize: 22 }} />
                          <Typography variant="subtitle1" fontWeight={800} color={isSelected ? "#38bdf8" : "#f8fafc"}>
                            {sched.nom}
                          </Typography>
                        </Stack>

                        <Stack direction="row" gap={0.5} sx={{ mx: 1 }}>
                          <Tooltip title="Modifier le nom">
                            <IconButton size="small" onClick={(e) => handleOpenEditModal(sched, e)} sx={{ color: "#38bdf8" }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!sched.estParDefaut && (
                            <Tooltip title="Supprimer cet horaire">
                              <IconButton size="small" onClick={(e) => handleDeleteSchedule(sched, e)} sx={{ color: "#f87171" }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>

                      <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1.5}>
                        <Typography variant="caption" color="#94a3b8" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                          {sched.description || "Aucune description"}
                        </Typography>
                        {sched.estParDefaut && (
                          <Chip label="Par défaut" size="small" sx={{ backgroundColor: "rgba(148, 163, 184, 0.2)", color: "#94a3b8", fontWeight: 700, fontSize: 10 }} />
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Panneau de configuration des heures par jour (Pleine Largeur) */}
        <Grid item xs={12} sx={{ width: "100%", p: "0 !important", mt: 3.5 }}>
          {selectedSchedule ? (
            <Paper className="glass-panel" sx={{ p: 4, borderRadius: 5, width: "100%", boxSizing: "border-box" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} width="100%">
                <Box flexGrow={1}>
                  <Typography variant="h6" fontWeight={800} color="#f8fafc">
                    Plages Horaires — {selectedSchedule.nom}
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    Définissez les heures de début, de fin et les jours affectés (du Lundi au Samedi)
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleSaveScheduleTimes}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  sx={{
                    ml: "auto",
                    borderRadius: 3,
                    px: 3.5,
                    py: 1,
                    fontWeight: 800,
                    textTransform: "none",
                    background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
                    boxShadow: "0 4px 15px rgba(2, 132, 199, 0.4)",
                  }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer les Heures"}
                </Button>
              </Stack>

              <Divider sx={{ mb: 3,mt:1, borderColor: "rgba(56, 189, 248, 0.15)" }} />

              {/* Option : Sélectionner le même horaire pour tous les jours */}
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  mb: 4,
                  borderRadius: 4.5,
                  backgroundColor: "rgba(2, 132, 199, 0.06)",
                  border: "1px dashed rgba(56, 189, 248, 0.35)",
                }}
              >
                <Stack gap={3}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <AccessTimeIcon sx={{ color: "#38bdf8", fontSize: 26 }} />
                    <Typography variant="h6" fontWeight={800} color="#f8fafc">
                      Appliquer une configuration rapide à toute la semaine :
                    </Typography>
                  </Box>

                  {/* Section 1 & 2 : Service & Autorisation Scan */}
                  <Grid container spacing={3}>
                    {/* 💼 Horaires de Travail / Service */}
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#94a3b8" display="block" mb={2}>
                          💼 Horaires de Service
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Début Service"
                              type="time"
                              size="small"
                              fullWidth
                              value={bulkStartTime}
                              onChange={(e) => setBulkStartTime(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f8fafc" } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Fin Service"
                              type="time"
                              size="small"
                              fullWidth
                              value={bulkEndTime}
                              onChange={(e) => setBulkEndTime(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f8fafc" } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Tolérance Entrée (min)"
                              type="number"
                              size="small"
                              fullWidth
                              value={bulkToleranceEntry}
                              onChange={(e) => setBulkToleranceEntry(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#34d399" } }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* ⏱️ Autorisation Scan Pointeuse */}
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#38bdf8" display="block" mb={2}>
                          ⏱️ Plage d'Autorisation de Scan (Pointeuse)
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Début Pointage"
                              type="time"
                              size="small"
                              fullWidth
                              value={bulkStartScan}
                              onChange={(e) => setBulkStartScan(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#38bdf8" } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Fin Pointage"
                              type="time"
                              size="small"
                              fullWidth
                              value={bulkEndScan}
                              onChange={(e) => setBulkEndScan(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#38bdf8" } }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                    {/* 🚬 Pause Cigarette (Courte) */}
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(168, 85, 247, 0.25)" }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#c084fc" display="block" mb={2}>
                          🚬 Pause Cigarette
                        </Typography>
                        <TextField
                          label="Durée Max Autorisée (min)"
                          type="number"
                          size="small"
                          fullWidth
                          value={bulkCigaretteMax}
                          onChange={(e) => setBulkCigaretteMax(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#c084fc" } }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Section 3 & 4 : Pause Repas & Pause Cigarette */}
                  <Grid container spacing={3}>
                    {/* 🍽️ Pause Repas & Tolérance */}
                    <Grid item xs={12} md={8}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#fbbf24" display="block" mb={2}>
                          🍽️ Pause Repas & Tolérance Retard
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Début Pause"
                              type="time"
                              size="small"
                              fullWidth
                              value={bulkStartBreak}
                              onChange={(e) => setBulkStartBreak(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#fbbf24" } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Fin Pause"
                              type="time"
                              size="small"
                              fullWidth
                              value={bulkEndBreak}
                              onChange={(e) => setBulkEndBreak(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#fbbf24" } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Tolérance Retard (min)"
                              type="number"
                              size="small"
                              fullWidth
                              value={bulkToleranceBreak}
                              onChange={(e) => setBulkToleranceBreak(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f43f5e" } }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* 🏁 Anticipation Fin de Service */}
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#38bdf8" display="block" mb={2}>
                          🏁 Anticipation Fin de Service
                        </Typography>
                        <TextField
                          label="Anticipation Autorisée (min)"
                          type="number"
                          size="small"
                          fullWidth
                          value={bulkMargeFinService}
                          onChange={(e) => setBulkMargeFinService(e.target.value)}
                          helperText="Minutes avant Fin Service"
                          InputLabelProps={{ shrink: true }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#38bdf8" } }}
                        />
                      </Paper>
                    </Grid>

                    {/* ⚠️ Notification Oubli Fin de Service */}
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(249, 115, 22, 0.3)" }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#f97316" display="block" mb={2}>
                          ⚠️ Notif. Oubli Fin de Service
                        </Typography>
                        <TextField
                          label="Délai après Fin (min)"
                          type="number"
                          size="small"
                          fullWidth
                          value={bulkDelaiNotifOubli}
                          onChange={(e) => setBulkDelaiNotifOubli(e.target.value)}
                          helperText="Minutes après Fin Service pour alerte"
                          InputLabelProps={{ shrink: true }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f97316" } }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      variant="contained"
                      onClick={handleApplyToAllDays}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                        color: "#ffffff",
                        textTransform: "none",
                        px: 4,
                        py: 1.2,
                        fontSize: 14,
                        boxShadow: "0 4px 14px rgba(56, 189, 248, 0.35)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)",
                        },
                      }}
                    >
                      Appliquer à tous les jours
                    </Button>
                  </Box>
                </Stack>
              </Paper>

              <Stack gap={3.5}>
                {selectedSchedule.jours?.map((dayConfig, idx) => (
                  <Paper
                    key={dayConfig.jourIndex}
                    sx={{
                      p: 3.5,
                      borderRadius: 4.5,
                      backgroundColor: dayConfig.estJourOuvre ? "rgba(30, 41, 59, 0.6)" : "rgba(15, 23, 42, 0.4)",
                      border: `1px solid ${dayConfig.estJourOuvre ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)"}`,
                      boxShadow: dayConfig.estJourOuvre ? "0 8px 30px rgba(0, 0, 0, 0.2)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Header de la journée */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={dayConfig.estJourOuvre ? 3 : 0}>
                      <Stack direction="row" alignItems="center" gap={2}>
                        <Typography variant="h6" fontWeight={800} color="#f8fafc">
                          {dayConfig.nomJour}
                        </Typography>
                        <Chip
                          label={dayConfig.estJourOuvre ? "Affecté" : "Non affecté"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            px: 1,
                            py: 0.5,
                            backgroundColor: dayConfig.estJourOuvre ? "rgba(52, 211, 153, 0.15)" : "rgba(148, 163, 184, 0.15)",
                            color: dayConfig.estJourOuvre ? "#34d399" : "#94a3b8",
                            border: `1px solid ${dayConfig.estJourOuvre ? "rgba(52, 211, 153, 0.3)" : "rgba(148, 163, 184, 0.3)"}`,
                            mx:1
                          }}
                        />
                      </Stack>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!dayConfig.estJourOuvre}
                            onChange={(e) => handleDayChange(idx, "estJourOuvre", e.target.checked)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </Stack>

                    {dayConfig.estJourOuvre && (
                      <Stack gap={3} mt={1}>
                        {/* Section 1 & 2 : Service & Autorisation Scan */}
                        <Grid container spacing={3}>
                          {/* 💼 Horaires de Travail / Service */}
                          <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                              <Typography variant="subtitle2" fontWeight={800} color="#94a3b8" display="block" mb={2}>
                                💼 Horaires de Service
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Début Service"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.heureDebut || "08:00"}
                                    onChange={(e) => handleDayChange(idx, "heureDebut", e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f8fafc" } }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Fin Service"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.heureFin || "17:00"}
                                    onChange={(e) => handleDayChange(idx, "heureFin", e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f8fafc" } }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Tolérance Entrée (min)"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.tolerenceRetardEntree !== undefined ? dayConfig.tolerenceRetardEntree : 5}
                                    onChange={(e) => handleDayChange(idx, "tolerenceRetardEntree", e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#34d399" } }}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>

                          {/* ⏱️ Autorisation Scan Pointeuse */}
                          <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                              <Typography variant="subtitle2" fontWeight={800} color="#38bdf8" display="block" mb={2}>
                                ⏱️ Plage d'Autorisation de Scan (Pointeuse)
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <TextField
                                    label="Début Pointage"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.heureDebutPointage || "07:30"}
                                    onChange={(e) => handleDayChange(idx, "heureDebutPointage", e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#38bdf8" } }}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    label="Fin Pointage"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.heureFinPointage || "18:00"}
                                    onChange={(e) => handleDayChange(idx, "heureFinPointage", e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#38bdf8" } }}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                            
                          </Grid>
                          {/* 🚬 Pause Cigarette (Courte) */}
                          <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(168, 85, 247, 0.25)" }}>
                              <Typography variant="subtitle2" fontWeight={800} color="#c084fc" display="block" mb={2}>
                                🚬 Pause Cigarette
                              </Typography>
                              <TextField
                                label="Durée Max Autorisée (min)"
                                type="number"
                                size="small"
                                fullWidth
                                value={dayConfig.dureePauseCigaretteMax !== undefined ? dayConfig.dureePauseCigaretteMax : 10}
                                onChange={(e) => handleDayChange(idx, "dureePauseCigaretteMax", Number(e.target.value))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#c084fc" } }}
                              />
                            </Paper>
                          </Grid>
                        </Grid>

                        {/* Section 3 & 4 : Pause Repas & Pause Cigarette */}
                        <Grid container spacing={3}>
                          {/* 🍽️ Pause Repas & Tolérance */}
                          <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
                              <Typography variant="subtitle2" fontWeight={800} color="#fbbf24" display="block" mb={2}>
                                🍽️ Pause Repas & Tolérance Retard
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Début Pause"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.heureDebutPause || "12:00"}
                                    onChange={(e) => handleDayChange(idx, "heureDebutPause", e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#fbbf24" } }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Fin Pause"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.heureFinPause || "13:00"}
                                    onChange={(e) => handleDayChange(idx, "heureFinPause", e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#fbbf24" } }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Tolérance (min)"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    value={dayConfig.tolerenceRetardPause !== undefined ? dayConfig.tolerenceRetardPause : 5}
                                    onChange={(e) => handleDayChange(idx, "tolerenceRetardPause", Number(e.target.value))}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f43f5e" } }}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>
                          {/* 🏁 Anticipation Fin de Service */}
                          <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                              <Typography variant="subtitle2" fontWeight={800} color="#38bdf8" display="block" mb={2}>
                                🏁 Anticipation Fin de Service
                              </Typography>
                              <TextField
                                label="Anticipation Autorisée (min)"
                                type="number"
                                size="small"
                                fullWidth
                                value={dayConfig.margeFinService !== undefined ? dayConfig.margeFinService : 35}
                                onChange={(e) => handleDayChange(idx, "margeFinService", Number(e.target.value))}
                                helperText="Minutes avant Fin Service"
                                InputLabelProps={{ shrink: true }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#38bdf8" } }}
                              />
                            </Paper>
                          </Grid>

                          {/* ⚠️ Notification Oubli Fin de Service */}
                          <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(249, 115, 22, 0.3)" }}>
                              <Typography variant="subtitle2" fontWeight={800} color="#f97316" display="block" mb={2}>
                                ⚠️ Notif. Oubli Fin de Service
                              </Typography>
                              <TextField
                                label="Délai après Fin (min)"
                                type="number"
                                size="small"
                                fullWidth
                                value={dayConfig.delaiNotificationOubliFinService !== undefined ? dayConfig.delaiNotificationOubliFinService : 15}
                                onChange={(e) => handleDayChange(idx, "delaiNotificationOubliFinService", Number(e.target.value))}
                                helperText="Minutes après Fin Service pour alerte"
                                InputLabelProps={{ shrink: true }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#f97316" } }}
                              />
                            </Paper>
                          </Grid>
                        </Grid>
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Paper>
          ) : (
            <Paper className="glass-panel" sx={{ py: 8, textAlign: "center", borderRadius: 5 }}>
              <Typography color="#94a3b8">
                Sélectionnez un horaire à gauche pour voir et modifier ses paramètres.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Modal Créer / Éditer un Horaire */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 5,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: "#f8fafc",
            minWidth: 400,
            p: 1,
          },
        }}
      >
        <DialogTitle fontWeight={800} sx={{ pt: 3, px: 4 }}>
          {editingId ? "Modifier l'Horaire" : "Créer un Régime d'Horaire"}
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Stack gap={3} mt={1}>
            <TextField
              fullWidth
              label="Nom de l'horaire *"
              placeholder="ex: Équipe Nuit, Service Restauration..."
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              InputLabelProps={{ style: { color: "#94a3b8" } }}
              InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description (optionnelle)"
              placeholder="ex: Service de 22h00 à 06h00..."
              value={modalDesc}
              onChange={(e) => setModalDesc(e.target.value)}
              InputLabelProps={{ style: { color: "#94a3b8" } }}
              InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: "#94a3b8" }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveModal}
            sx={{
              borderRadius: 3,
              px: 3.5,
              py: 1,
              background: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
            }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
