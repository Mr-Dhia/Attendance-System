import { useState, useEffect, useMemo } from "react";
import {
  Typography, Button, Stack, Grid, Paper,
  CircularProgress, Box, Alert, TextField,
  Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, Chip,
  IconButton, Tooltip, Avatar, Divider,
  List, ListItemButton, ListItemText, ListItemIcon,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Menu, MenuItem
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import PeopleIcon from "@mui/icons-material/People";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import BadgeIcon from "@mui/icons-material/Badge";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  addPosition, updatePosition, deletePosition
} from "../services/department.service";

const COLOR_PRESETS = [
  "#3B82F6", // Bleu
  "#10B981", // Émeraude
  "#8B5CF6", // Violet
  "#F59E0B", // Ambre
  "#EC4899", // Rose
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#EF4444"  // Rouge
];

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [posSearch, setPosSearch] = useState("");

  // Modales Département
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "", color: "#3B82F6" });
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Modales Poste
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [posForm, setPosForm] = useState({ title: "", code: "", description: "" });
  const [posSubmitting, setPosSubmitting] = useState(false);

  // Menu d'actions contextuelles
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [menuTargetDept, setMenuTargetDept] = useState(null);

  // Confirmation de suppression
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: "", id: null, targetId: null, name: "" });

  const fetchDeptData = async () => {
    try {
      const res = await getDepartments();
      if (res.success) {
        setDepartments(res.data);
        if (res.data.length > 0 && !selectedDeptId) {
          setSelectedDeptId(res.data[0]._id);
        }
      } else {
        setError("Erreur lors du chargement des départements");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeptData();
  }, []);

  // Département sélectionné actuel
  const selectedDept = useMemo(() => {
    if (!departments.length) return null;
    return departments.find(d => d._id === selectedDeptId) || departments[0];
  }, [departments, selectedDeptId]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const totalDepts = departments.length;
    let totalPositions = 0;
    let totalEmployees = 0;

    departments.forEach(d => {
      totalPositions += d.positions ? d.positions.length : 0;
      totalEmployees += d.totalEmployees || 0;
    });

    return { totalDepts, totalPositions, totalEmployees };
  }, [departments]);

  // Filtrage des départements (navigation gauche)
  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return departments;
    const term = search.toLowerCase();
    return departments.filter(d =>
      d.name.toLowerCase().includes(term) ||
      d.code.toLowerCase().includes(term)
    );
  }, [departments, search]);

  // Filtrage des postes dans le département sélectionné
  const filteredPositions = useMemo(() => {
    if (!selectedDept || !selectedDept.positions) return [];
    if (!posSearch.trim()) return selectedDept.positions;
    const term = posSearch.toLowerCase();
    return selectedDept.positions.filter(p =>
      p.title.toLowerCase().includes(term) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  }, [selectedDept, posSearch]);

  // Handlers Département
  const handleOpenDeptModal = (dept = null) => {
    setActionMenuAnchor(null);
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code, description: dept.description || "", color: dept.color || "#3B82F6" });
    } else {
      setEditingDept(null);
      setDeptForm({ name: "", code: "", description: "", color: COLOR_PRESETS[0] });
    }
    setDeptModalOpen(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    setDeptSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingDept) {
        await updateDepartment(editingDept._id, deptForm);
        setSuccess("Département mis à jour avec succès");
      } else {
        const res = await createDepartment(deptForm);
        setSuccess("Département créé avec succès");
        if (res.data) setSelectedDeptId(res.data._id);
      }
      setDeptModalOpen(false);
      fetchDeptData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement du département");
    } finally {
      setDeptSubmitting(false);
    }
  };

  // Handlers Poste
  const handleOpenPosModal = (pos = null) => {
    if (!selectedDept) return;
    if (pos) {
      setEditingPos(pos);
      setPosForm({ title: pos.title, code: pos.code || "", description: pos.description || "" });
    } else {
      setEditingPos(null);
      setPosForm({ title: "", code: "", description: "" });
    }
    setPosModalOpen(true);
  };

  const handleSavePos = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;
    setPosSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingPos) {
        await updatePosition(selectedDept._id, editingPos._id, posForm);
        setSuccess("Poste mis à jour avec succès");
      } else {
        await addPosition(selectedDept._id, posForm);
        setSuccess("Poste ajouté avec succès");
      }
      setPosModalOpen(false);
      fetchDeptData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement du poste");
    } finally {
      setPosSubmitting(false);
    }
  };

  // Suppression
  const handleConfirmDelete = async () => {
    const { type, id, targetId } = deleteConfirm;
    setError("");
    setSuccess("");

    try {
      if (type === "dept") {
        await deleteDepartment(id);
        setSuccess("Département supprimé avec succès");
        if (selectedDeptId === id) {
          const remaining = departments.filter(d => d._id !== id);
          setSelectedDeptId(remaining.length > 0 ? remaining[0]._id : null);
        }
      } else if (type === "pos") {
        await deletePosition(targetId, id);
        setSuccess("Poste supprimé avec succès");
      }
      setDeleteConfirm({ open: false, type: "", id: null, targetId: null, name: "" });
      fetchDeptData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: "0 auto" }}>
      {/* En-tête principal & Statistiques */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: "#f8fafc", letterSpacing: "-0.5px" }}>
            Structure Organisationnelle
          </Typography>
          <Typography variant="body2" color="#94a3b8" sx={{ mt: 0.5 }}>
            Espace de gestion centrale des départements et affectation des fonctions de votre entreprise.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDeptModal(null)}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.2,
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              boxShadow: "0 8px 25px rgba(2, 132, 199, 0.35)",
              fontWeight: 700,
              textTransform: "none"
            }}
          >
            Nouveau Département
          </Button>
        </Stack>
      </Stack>

      {/* Notifications */}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3, borderRadius: 3 }}>{success}</Alert>}

      {/* Barres de Métriques Rapides */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", width: 46, height: 46, borderRadius: 2.5 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="#94a3b8" fontWeight={700} display="block">DÉPARTEMENTS</Typography>
                <Typography variant="h5" fontWeight={800} color="#f8fafc">{stats.totalDepts}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "#34d399", width: 46, height: 46, borderRadius: 2.5 }}>
                <WorkIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="#94a3b8" fontWeight={700} display="block">POSTES DÉFINIS</Typography>
                <Typography variant="h5" fontWeight={800} color="#f8fafc">{stats.totalPositions}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", width: 46, height: 46, borderRadius: 2.5 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="#94a3b8" fontWeight={700} display="block">EFFECTIF TOTAL</Typography>
                <Typography variant="h5" fontWeight={800} color="#f8fafc">{stats.totalEmployees} employé(s)</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* DISPOSITION MASTER-DETAIL (PANNEAU GAUCHE / PANNEAU DROIT) */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={48} sx={{ color: "#38bdf8" }} />
        </Box>
      ) : departments.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", borderRadius: 4, bgcolor: "rgba(15, 23, 42, 0.6)", border: "2px dashed rgba(56, 189, 248, 0.2)" }}>
          <BusinessIcon sx={{ fontSize: 64, color: "#64748b", mb: 2 }} />
          <Typography variant="h6" color="#f8fafc" gutterBottom fontWeight={700}>
            Aucun département créé pour le moment
          </Typography>
          <Typography variant="body2" color="#94a3b8" sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
            Créez vos départements d'entreprise pour y ajouter ensuite vos postes et y organiser vos collaborateurs.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDeptModal(null)} sx={{ borderRadius: 3, px: 4 }}>
            Créer un Département
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* PANNEAU GAUCHE : LISTE ET NAVIGATION DES DÉPARTEMENTS */}
          <Grid item xs={12} md={4} lg={3.5}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3.5, bgcolor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.18)" }}>
              <TextField
                fullWidth
                placeholder="Filtrer les départements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#64748b", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5, bgcolor: "rgba(9, 13, 22, 0.6)", fontSize: "0.88rem" }
                }}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, px: 1, mb: 1, display: "block", letterSpacing: "0.5px" }}>
                DÉPARTEMENTS ({filteredDepartments.length})
              </Typography>

              <List sx={{ display: "flex", flexDirection: "column", gap: 1, p: 0 }}>
                {filteredDepartments.map((dept) => {
                  const isSelected = selectedDeptId === dept._id;
                  const color = dept.color || "#3B82F6";

                  return (
                    <Paper
                      key={dept._id}
                      elevation={0}
                      onClick={() => setSelectedDeptId(dept._id)}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        cursor: "pointer",
                        bgcolor: isSelected ? `${color}18` : "rgba(9, 13, 22, 0.4)",
                        border: isSelected ? `1.5px solid ${color}` : "1px solid rgba(56, 189, 248, 0.1)",
                        boxShadow: isSelected ? `0 6px 20px ${color}25` : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: isSelected ? `${color}22` : "rgba(56, 189, 248, 0.08)",
                          borderColor: isSelected ? color : "rgba(56, 189, 248, 0.25)"
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 38,
                              borderRadius: 1.5,
                              bgcolor: color,
                              flexShrink: 0
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} color={isSelected ? "#f8fafc" : "#cbd5e1"} noWrap fontSize={14}>
                              {dept.name}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3, mx: 0.5 }}>
                              <Chip
                                label={dept.code}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  fontWeight: 800,
                                  bgcolor: `${color}25`,
                                  color: color,
                                  border: `1px solid ${color}40`
                                }}
                              />
                              <Typography variant="caption" color="#64748b" fontSize={11}>
                                {dept.positions ? dept.positions.length : 0} poste(s)
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>

                        <ChevronRightIcon sx={{ color: isSelected ? color : "#475569", fontSize: 20 }} />
                      </Stack>
                    </Paper>
                  );
                })}
              </List>
            </Paper>
          </Grid>

          {/* PANNEAU DROIT : DÉTAIL DU DÉPARTEMENT SÉLECTIONNÉ ET GESTION DES POSTES */}
          <Grid item xs={12} md={8} lg={8.5}>
            {selectedDept && (
              <Box>
                {/* Carte En-tête du Département */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    mb: 3,
                    borderRadius: 4,
                    bgcolor: "rgba(15, 23, 42, 0.95)",
                    border: `1px solid ${selectedDept.color || "#3B82F6"}40`,
                    borderLeft: `8px solid ${selectedDept.color || "#3B82F6"}`,
                    boxShadow: `0 12px 30px rgba(0,0,0,0.3)`
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start" }} spacing={2}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <Typography variant="h5" fontWeight={800} color="#f8fafc">
                          {selectedDept.name}
                        </Typography>
                        <Chip
                          label={selectedDept.code}
                          sx={{
                            bgcolor: `${selectedDept.color || "#3B82F6"}25`,
                            color: selectedDept.color || "#3B82F6",
                            fontWeight: 800,
                            border: `1px solid ${selectedDept.color || "#3B82F6"}50`,
                            fontSize: "0.8rem"
                          }}
                        />
                      </Stack>

                      <Typography variant="body2" color="#94a3b8" sx={{ maxWidth: 650 }}>
                        {selectedDept.description || "Aucune description renseignée pour ce département."}
                      </Typography>
                    </Box>

                    {/* Actions sur le Département */}
                    <Stack direction="row" spacing={1} sx={{ mx: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDeptModal(selectedDept)}
                        sx={{
                          borderRadius: 2.5,
                          color: "#38bdf8",
                          borderColor: "rgba(56, 189, 248, 0.3)",
                          textTransform: "none",
                          fontWeight: 700
                        }}
                      >
                        Éditer
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteConfirm({ open: true, type: "dept", id: selectedDept._id, targetId: null, name: selectedDept.name })}
                        sx={{
                          borderRadius: 2.5,
                          textTransform: "none",
                          fontWeight: 700
                        }}
                      >
                        Supprimer
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.08)" }} />

                  {/* Résumé des effectifs */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", width: 36, height: 36 }}>
                        <WorkIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>POSTES ASSOCIÉS</Typography>
                        <Typography variant="subtitle2" fontWeight={800} color="#f8fafc">
                          {selectedDept.positions ? selectedDept.positions.length : 0} poste(s)
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "#34d399", width: 36, height: 36 }}>
                        <PeopleIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>EFFECTIF RATTACHÉ</Typography>
                        <Typography variant="subtitle2" fontWeight={800} color="#f8fafc">
                          {selectedDept.totalEmployees || 0} employé(s)
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Section Gestion des Postes du Département */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#f8fafc" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <WorkIcon sx={{ color: selectedDept.color || "#38bdf8" }} /> Postes du département ({filteredPositions.length})
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Définissez les fonctions et titres de postes au sein de {selectedDept.name}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mx: 1 }}>
                      <TextField
                        placeholder="Rechercher un poste..."
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: "#64748b", fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2.5, bgcolor: "rgba(9, 13, 22, 0.6)", fontSize: "0.82rem" }
                        }}
                        size="small"
                      />
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenPosModal(null)}
                        sx={{
                          borderRadius: 2.5,
                          px: 2.5,
                          bgcolor: selectedDept.color || "#38bdf8",
                          color: "#fff",
                          fontWeight: 700,
                          textTransform: "none",
                          flexShrink: 0
                        }}
                      >
                        Nouveau Poste
                      </Button>
                    </Stack>
                  </Stack>

                  {/* Tableau / Liste des Postes */}
                  {filteredPositions.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: "center", bgcolor: "rgba(9, 13, 22, 0.4)", borderRadius: 3, border: "1px dashed rgba(56, 189, 248, 0.15)" }}>
                      <WorkIcon sx={{ fontSize: 48, color: "#475569", mb: 1 }} />
                      <Typography variant="subtitle2" color="#94a3b8">
                        {posSearch ? "Aucun poste ne correspond à votre recherche" : "Aucun poste configuré dans ce département."}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ borderBottom: "2px solid rgba(56, 189, 248, 0.15)" }}>
                            <TableCell sx={{ color: "#64748b", fontWeight: 800, fontSize: "0.75rem" }}>TITRE DU POSTE</TableCell>
                            <TableCell sx={{ color: "#64748b", fontWeight: 800, fontSize: "0.75rem" }}>CODE</TableCell>
                            <TableCell sx={{ color: "#64748b", fontWeight: 800, fontSize: "0.75rem" }}>DESCRIPTION</TableCell>
                            <TableCell align="center" sx={{ color: "#64748b", fontWeight: 800, fontSize: "0.75rem" }}>EFFECTIF</TableCell>
                            <TableCell align="right" sx={{ color: "#64748b", fontWeight: 800, fontSize: "0.75rem" }}>ACTIONS</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredPositions.map((pos) => (
                            <TableRow
                              key={pos._id}
                              sx={{
                                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                                "&:hover": { bgcolor: "rgba(56, 189, 248, 0.05)" }
                              }}
                            >
                              <TableCell sx={{ color: "#f8fafc", fontWeight: 700, fontSize: "0.9rem" }}>
                                {pos.title}
                              </TableCell>
                              <TableCell>
                                {pos.code ? (
                                  <Chip label={pos.code} size="small" sx={{ fontWeight: 800, fontSize: "0.68rem", bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }} />
                                ) : (
                                  <Typography variant="caption" color="#475569">—</Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ color: "#94a3b8", fontSize: "0.85rem", maxWidth: 280 }}>
                                {pos.description || "—"}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${pos.employeeCount || 0} employé(s)`}
                                  size="small"
                                  color={pos.employeeCount > 0 ? "primary" : "default"}
                                  sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mx: 1 }}>
                                  <Tooltip title="Modifier le poste">
                                    <IconButton size="small" onClick={() => handleOpenPosModal(pos)} sx={{ color: "#38bdf8" }}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Supprimer le poste">
                                    <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, type: "pos", id: pos._id, targetId: selectedDept._id, name: pos.title })} sx={{ color: "#f87171" }}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      {/* Modale Département (Créer / Éditer) */}
      <Dialog open={deptModalOpen} onClose={() => setDeptModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, bgcolor: "#0f172a", color: "#f8fafc" } }}>
        <form onSubmit={handleSaveDept}>
          <DialogTitle fontWeight={800} sx={{ borderBottom: "1px solid rgba(56, 189, 248, 0.15)", py: 2.5 }}>
            {editingDept ? "Modifier le Département" : "Nouveau Département"}
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Nom du Département"
                required
                fullWidth
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="ex: Ressources Humaines, Informatique..."
              />
              <TextField
                label="Code du Département"
                required
                fullWidth
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                placeholder="ex: RH, IT, ENG..."
                helperText="Code court unique (2 à 5 caractères)"
              />
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="Description des rôles et responsabilités..."
              />

              {/* Sélection de couleur */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1, color: "#94a3b8" }}>
                  <ColorLensIcon fontSize="small" color="primary" /> Couleur d'identification
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  {COLOR_PRESETS.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setDeptForm({ ...deptForm, color })}
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        bgcolor: color,
                        cursor: "pointer",
                        border: deptForm.color === color ? "3px solid #f8fafc" : "2px solid transparent",
                        boxShadow: deptForm.color === color ? `0 0 15px ${color}` : "none",
                        transition: "transform 0.15s",
                        "&:hover": { transform: "scale(1.15)" }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: "1px solid rgba(56, 189, 248, 0.15)" }}>
            <Button onClick={() => setDeptModalOpen(false)} sx={{ color: "#94a3b8" }}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={deptSubmitting} sx={{ borderRadius: 2.5, px: 3, bgcolor: "#0284c7" }}>
              {deptSubmitting ? <CircularProgress size={24} /> : "Enregistrer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modale Poste (Créer / Éditer) */}
      <Dialog open={posModalOpen} onClose={() => setPosModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, bgcolor: "#0f172a", color: "#f8fafc" } }}>
        <form onSubmit={handleSavePos}>
          <DialogTitle fontWeight={800} sx={{ borderBottom: "1px solid rgba(56, 189, 248, 0.15)", py: 2.5 }}>
            {editingPos ? "Modifier le Poste" : "Ajouter un Poste"}
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Titre du Poste"
                required
                fullWidth
                value={posForm.title}
                onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                placeholder="ex: Développeur Fullstack, Chef de Projet, Comptable..."
              />
              <TextField
                label="Code Poste (optionnel)"
                fullWidth
                value={posForm.code}
                onChange={(e) => setPosForm({ ...posForm, code: e.target.value.toUpperCase() })}
                placeholder="ex: DEV-FS, PM, COMPTA..."
              />
              <TextField
                label="Description du Poste"
                multiline
                rows={3}
                fullWidth
                value={posForm.description}
                onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
                placeholder="Responsabilités et missions principales du poste..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: "1px solid rgba(56, 189, 248, 0.15)" }}>
            <Button onClick={() => setPosModalOpen(false)} sx={{ color: "#94a3b8" }}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={posSubmitting} sx={{ borderRadius: 2.5, px: 3, bgcolor: "#0284c7" }}>
              {posSubmitting ? <CircularProgress size={24} /> : "Enregistrer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Confirmation de Suppression */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#0f172a", color: "#f8fafc" } }}>
        <DialogTitle fontWeight={800}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Voulez-vous vraiment supprimer {deleteConfirm.type === "dept" ? "le département" : "le poste"} <strong>{deleteConfirm.name}</strong> ?
          </Typography>
          {deleteConfirm.type === "dept" && (
            <Typography variant="caption" color="error.main" sx={{ display: "block", mt: 1.5, fontWeight: 700 }}>
              Attention : La suppression du département entraînera la suppression de tous les postes rattachés.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })} sx={{ color: "#94a3b8" }}>Annuler</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 2.5, px: 3 }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
