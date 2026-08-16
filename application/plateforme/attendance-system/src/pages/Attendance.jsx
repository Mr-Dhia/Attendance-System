import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Paper, Typography, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, TextField, MenuItem, Stack, IconButton,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import SensorsIcon from "@mui/icons-material/Sensors";
import LockClockIcon from "@mui/icons-material/LockClock";
import { getAttendance, createAttendance, updateAttendance, deleteAttendance } from "../services/attendance.service";
import { getEmployees } from "../services/employee.service";
import { getPhotoUrl } from "../services/api";
import { statusColor, renderPointagesResume, calculerTempsTotal } from "../utils/attendance";
import ScheduleModal from "../components/ScheduleModal";

const emptyForm = { employee: "", date: "", statut: "À l'heure", pointages: [] };

export default function Attendance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtres
  const [filterDate, setFilterDate] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterEmployee, setFilterEmployee] = useState(searchParams.get("employee") || "");

  // Dialog pointage manuel
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Modal Horaires de Travail
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const fetchLogs = async (silencieux = false) => {
    if (!silencieux) setLoading(true);
    try {
      const filters = {};
      if (filterDate) filters.date = filterDate;
      if (filterStatut) filters.statut = filterStatut;
      if (filterEmployee) filters.employee = filterEmployee;
      const data = await getAttendance(filters);
      setLogs(data);
    } catch {
      setError("Erreur lors du chargement des pointages biométriques");
    } finally {
      if (!silencieux) setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees().then(setEmployees);
  }, []);

  useEffect(() => {
    const empParam = searchParams.get("employee");
    if (empParam !== null && empParam !== filterEmployee) {
      setFilterEmployee(empParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLogs();
  }, [filterDate, filterStatut, filterEmployee]);

  // Polling automatique pour actualiser les scans récents
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [filterDate, filterStatut, filterEmployee]);

  const handleResetFilters = () => {
    setFilterDate("");
    setFilterStatut("");
    setFilterEmployee("");
  };

  const handleOpen = (log = null) => {
    if (log) {
      setEditId(log._id);
      const dateFormatted = log.date ? new Date(log.date).toISOString().split("T")[0] : "";
      setForm({
        employee: log.employee?._id || "",
        date: dateFormatted,
        statut: log.statut || "À l'heure",
        pointages: log.pointages || [],
      });
    } else {
      setEditId(null);
      const todayStr = new Date().toISOString().split("T")[0];
      setForm({
        ...emptyForm,
        date: todayStr,
        pointages: [{ heure: "08:00", type: "entree" }],
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.date) {
      setError("Veuillez sélectionner un employé et une date.");
      return;
    }

    try {
      if (editId) {
        await updateAttendance(editId, form);
      } else {
        await createAttendance(form);
      }
      handleClose();
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'enregistrement du pointage.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce pointage ?")) {
      try {
        await deleteAttendance(id);
        fetchLogs();
      } catch {
        setError("Erreur lors de la suppression du pointage.");
      }
    }
  };

  const handleAddPointageInForm = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const lastType = form.pointages.length > 0 ? form.pointages[form.pointages.length - 1].type : "sortie";
    const newType = lastType === "entree" ? "sortie" : "entree";
    const newLabel = newType === "sortie" ? "Sortie Fin de Service" : "Entrée Début Service";

    setForm({
      ...form,
      pointages: [...form.pointages, { heure: `${h}:${m}`, type: newType, label: newLabel }],
    });
  };

  const handleRemovePointageInForm = (idx) => {
    setForm({
      ...form,
      pointages: form.pointages.filter((_, i) => i !== idx),
    });
  };

  const handlePointageChange = (idx, field, val) => {
    const updated = [...form.pointages];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm({ ...form, pointages: updated });
  };

  return (
    <Box display="flex" flexDirection="column" gap={3} className="animate-fade-in" width="100%">
      {/* Hero Section Banner */}
      <Paper
        elevation={0}
        className="glass-panel-glow"
        sx={{
          pt: { xs: 4, md: 5 },
          pb: { xs: 4, md: 5 },
          pl: { xs: 4, md: 6 },
          pr: { xs: 4, md: 6 },
          mb: 4,
          borderRadius: 5,
          background: "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.85))",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={3} width="100%">
          <Box>
            <Typography variant="h4" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px" mb={1.5}>
              Registre des Présences Biométriques
            </Typography>
            <Typography variant="body2" color="#94a3b8">
              Pointages en temps réel avec validation d'empreinte digitale & contrôle des horaires
            </Typography>
          </Box>

          <Stack direction="row" gap={2} justifyContent="flex-end" alignItems="center" sx={{ ml: { md: "auto" }, flexShrink: 0 }}>
            <Button
              variant="outlined"
              startIcon={<LockClockIcon />}
              onClick={() => setScheduleOpen(true)}
              sx={{
                borderRadius: 4,
                px: 3,
                py: 1.8,
                fontWeight: 700,
                fontSize: 14,
                textTransform: "none",
                color: "#38bdf8",
                borderColor: "rgba(56, 189, 248, 0.35)",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                "&:hover": {
                  backgroundColor: "rgba(2, 132, 199, 0.15)",
                  borderColor: "#0284c7",
                },
              }}
            >
              Horaires de Travail
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{
                borderRadius: 4,
                px: 4,
                py: 1.8,
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "0.5px",
                textTransform: "none",
                background: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
                boxShadow: "0 8px 30px rgba(6, 182, 212, 0.5)",
                flexShrink: 0,
              }}
            >
              Nouveau Pointage
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", mb: 4 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Glassmorphism Filters Section */}
      <Box mb={4} width="100%">
        <Paper
          className="glass-panel"
          sx={{
            width: "100%",
            p: { xs: 3, md: 4 },
            borderRadius: 5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={800} color="#f8fafc" mb={2.5}>
            Filtres de Recherche & Périodes
          </Typography>

          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                size="small"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                InputLabelProps={{ shrink: true, style: { color: "#94a3b8" } }}
                InputProps={{ sx: { color: "#f8fafc", borderRadius: 3, borderColor: "rgba(56, 189, 248, 0.2)" } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Statut"
                size="small"
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                InputLabelProps={{ style: { color: "#94a3b8" } }}
                InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
              >
                <MenuItem value="">Tous les Statuts</MenuItem>
                <MenuItem value="À l'heure">À l'heure</MenuItem>
                <MenuItem value="Retard">Retard</MenuItem>
                <MenuItem value="Absent">Absent</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                fullWidth
                select
                label="Employé"
                size="small"
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                InputLabelProps={{ style: { color: "#94a3b8" } }}
                InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
              >
                <MenuItem value="">Tous les Employés</MenuItem>
                {employees.map((e) => (
                  <MenuItem key={e._id} value={e._id}>
                    {e.name} ({e.matricule})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleResetFilters}
                sx={{
                  height: 40,
                  borderRadius: 3,
                  borderColor: "rgba(56, 189, 248, 0.3)",
                  color: "#38bdf8",
                  "&:hover": { backgroundColor: "rgba(56, 189, 248, 0.1)" },
                  textTransform: "none",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>


      {/* Main Table Panel */}
      <Paper className="glass-panel" sx={{ borderRadius: 5, overflow: "hidden", p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "rgba(15, 23, 42, 0.85)" }}>
                <TableRow>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700 }}>Employé</TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700 }}>Statut</TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700 }}>Pointages de la Journée</TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700 }}>Temps Total</TableCell>
                  <TableCell align="right" sx={{ color: "#94a3b8", fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#64748b" }}>
                      Aucune donnée de présence enregistrée.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const emp = log.employee || {};
                    const tempsInfo = calculerTempsTotal(log.pointages || [], log.date);

                    return (
                      <TableRow key={log._id} hover sx={{ "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.02)" } }}>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            sx={{ cursor: "pointer" }}
                            onClick={() => emp._id && navigate(`/employees/${emp._id}`)}
                          >
                            <Avatar src={getPhotoUrl(emp.photo)} sx={{ width: 38, height: 38, border: "1px solid #38bdf8" }}>
                              {emp.name ? emp.name[0] : "?"}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="#f8fafc">
                                {emp.name || "Inconnu"}
                              </Typography>
                              <Typography variant="caption" color="#94a3b8">
                                {emp.matricule || "N/A"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: "#cbd5e1" }}>
                          {log.date ? new Date(log.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : "--"}
                        </TableCell>
                        <TableCell sx={{ color: "#f8fafc" }}>
                          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mx: 0.5 }}>
                            <Chip
                              label={log.statut}
                              size="small"
                              sx={{
                                backgroundColor: statusColor(log.statut) + "25",
                                color: statusColor(log.statut),
                                border: `1px solid ${statusColor(log.statut)}50`,
                                fontWeight: 700,
                              }}
                            />
                            {log.retardMins > 0 && (
                              <Chip
                                label={`Matin +${log.retardMins} min`}
                                size="small"
                                sx={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", fontWeight: 700, fontSize: 10 }}
                              />
                            )}
                            {log.retardPauseMins > 0 && (
                              <Chip
                                label={`Pause +${log.retardPauseMins} min`}
                                size="small"
                                sx={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)", fontWeight: 700, fontSize: 10 }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: "#f8fafc" }}>
                          {renderPointagesResume(log.pointages || [])}
                        </TableCell>
                        <TableCell sx={{ color: "#34d399", fontWeight: 700 }}>
                          <Stack direction="row" alignItems="center" gap={1} sx={{ mx: 1 }}>
                            <Typography variant="body2" fontWeight={700} color="#34d399">
                              {tempsInfo.texte}
                            </Typography>
                            {tempsInfo.enCours && (
                              <Chip
                                label="En cours"
                                size="small"
                                color="info"
                                sx={{ height: 20, fontSize: 11, fontWeight: 700, px: 1 }}
                              />
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mx: 1 }}>
                            <IconButton size="small" onClick={() => handleOpen(log)} sx={{ color: "#38bdf8" }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(log._id)} sx={{ color: "#f87171" }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog Nouveau/Edition Pointage */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
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
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          {editId ? "Modifier le Pointage" : "Créer un Pointage Manuel"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              select
              label="Employé"
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
              required
            >
              {employees.map((e) => (
                <MenuItem key={e._id} value={e._id}>
                  {e.name} ({e.matricule})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              fullWidth
              select
              label="Statut de présence"
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
            >
              <MenuItem value="À l'heure">À l'heure</MenuItem>
              <MenuItem value="Retard">Retard</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
            </TextField>

            {/* Sub-list of punch timestamps */}
            <Box mt={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle2" fontWeight={700} color="#f8fafc">
                  Pointages de la Journée ({form.pointages.length})
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddPointageInForm} sx={{ color: "#38bdf8" }}>
                  Ajouter un scan
                </Button>
              </Stack>

              <Stack spacing={1.5}>
                {form.pointages.map((pt, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      backgroundColor: "rgba(30, 41, 59, 0.6)",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <TextField
                      type="time"
                      label={`Pointage #${idx + 1}`}
                      size="small"
                      value={pt.heure}
                      onChange={(e) => handlePointageChange(idx, "heure", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      select
                      size="small"
                      label="Type"
                      value={pt.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const defaultLabel = newType === "sortie" ? "Sortie Fin de Service" : "Entrée Début Service";
                        const updated = [...form.pointages];
                        updated[idx] = { ...updated[idx], type: newType, label: defaultLabel };
                        setForm({ ...form, pointages: updated });
                      }}
                      sx={{ width: 110 }}
                    >
                      <MenuItem value="entree">Entrée</MenuItem>
                      <MenuItem value="sortie">Sortie</MenuItem>
                    </TextField>

                    <TextField
                      select
                      size="small"
                      label="Événement"
                      value={pt.label || (pt.type === "sortie" ? "Sortie Fin de Service" : "Entrée Début Service")}
                      onChange={(e) => handlePointageChange(idx, "label", e.target.value)}
                      sx={{ width: 175 }}
                    >
                      <MenuItem value="Entrée Début Service">Entrée Début Service</MenuItem>
                      <MenuItem value="Sortie Pause">Sortie Pause</MenuItem>
                      <MenuItem value="Entrée Pause">Entrée Pause</MenuItem>
                      <MenuItem value="Sortie Repas">Sortie Repas</MenuItem>
                      <MenuItem value="Entrée Repas">Entrée Repas</MenuItem>
                      <MenuItem value="Sortie Fin de Service">Sortie Fin de Service</MenuItem>
                    </TextField>

                    <IconButton size="small" onClick={() => handleRemovePointageInForm(idx)} sx={{ color: "#f87171", ml: "auto" }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose} sx={{ color: "#94a3b8" }}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Schedule Management Modal */}
      <ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </Box>
  );
}