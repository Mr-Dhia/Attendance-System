import { useState, useEffect, useMemo } from "react";
import {
  Box, Paper, Typography, Button, Stack, Grid,
  CircularProgress, Alert, TextField, MenuItem,
  Chip, Avatar, Divider, Tooltip, Checkbox, IconButton,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LockClockIcon from "@mui/icons-material/LockClock";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TodayIcon from "@mui/icons-material/Today";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import TableViewIcon from "@mui/icons-material/TableView";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  getAllSchedules, getWeeklyAssignments, assignWeeklyEmployees,
} from "../services/schedule.service";
import { getEmployees } from "../services/employee.service";
import { getPhotoUrl } from "../services/api";

// Helpers pour calcul des semaines (Lundi à Dimanche/Samedi)
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getSunday(monday) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function formatDateShort(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const toLocalYMD = (date) => {
  if (!date) return "";
  const dt = new Date(date);
  if (isNaN(dt.getTime())) return String(date).split("T")[0];
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ScheduleAssignments() {
  const [activeTab, setActiveTab] = useState(0); // 0: Module d'affectation, 1: Récapitulatif global

  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [weeklyData, setWeeklyData] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [refDate, setRefDate] = useState(new Date());
  const monday = useMemo(() => getMonday(refDate), [refDate]);
  const sunday = getSunday(monday);

  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const isoDateStr = toLocalYMD(monday);
      const [schedData, empData, weekRes] = await Promise.all([
        getAllSchedules(),
        getEmployees(),
        getWeeklyAssignments(isoDateStr),
      ]);
      setSchedules(schedData);
      setEmployees(empData);
      setWeeklyData(weekRes);

      if (schedData.length > 0) {
        setSelectedSchedule((prev) => {
          if (!prev) return schedData[0];
          return schedData.find((s) => s._id === prev._id) || schedData[0];
        });
      }
    } catch {
      setError("Erreur lors du chargement des affectations hebdomadaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refDate]);

  // Helper : vérifie si l'employé est strictement En Contrat (Aujourd'hui ET durant cette semaine)
  const isEmployeeEnContrat = (emp) => {
    if (!emp) return false;
    if (emp.statut === "Inactif") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Contrôle par rapport à aujourd'hui
    if (emp.scheduleStartDate) {
      const sStart = new Date(emp.scheduleStartDate);
      sStart.setHours(0, 0, 0, 0);
      if (today < sStart) return false;
    }

    if (emp.scheduleEndDate) {
      const sEnd = new Date(emp.scheduleEndDate);
      sEnd.setHours(23, 59, 59, 999);
      if (today > sEnd) return false;
    }

    // 2. Contrôle par rapport à la semaine sélectionnée
    if (emp.scheduleStartDate) {
      const sStart = new Date(emp.scheduleStartDate);
      sStart.setHours(0, 0, 0, 0);
      if (sunday < sStart) return false;
    }

    if (emp.scheduleEndDate) {
      const sEnd = new Date(emp.scheduleEndDate);
      sEnd.setHours(23, 59, 59, 999);
      if (monday > sEnd) return false;
    }

    return true;
  };

  // Navigation entre les semaines
  const handlePrevWeek = () => {
    const prev = new Date(refDate);
    prev.setDate(prev.getDate() - 7);
    setRefDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(refDate);
    next.setDate(next.getDate() + 7);
    setRefDate(next);
  };

  const handleTodayWeek = () => {
    setRefDate(new Date());
  };

  // Récupérer les employés affectés à l'horaire sélectionné pour CETTE SEMAINE (En contrat uniquement)
  useEffect(() => {
    if (selectedSchedule && weeklyData?.assignments) {
      const currentAss = weeklyData.assignments.find(
        (a) => a.workSchedule?._id === selectedSchedule._id || a.workSchedule === selectedSchedule._id
      );
      if (currentAss && Array.isArray(currentAss.employees)) {
        const ids = currentAss.employees
          .map((e) => (typeof e === "object" ? e._id : e))
          .filter((id) => {
            const empObj = employees.find((emp) => emp._id === id);
            return empObj && isEmployeeEnContrat(empObj);
          });
        setSelectedEmpIds(ids);
      } else {
        setSelectedEmpIds([]);
      }
    }
  }, [selectedSchedule, weeklyData, employees]);

  // Trouver à quelle équipe un employé est affecté CETTE SEMAINE
  const getEmployeeWeeklyScheduleNom = (emp) => {
    if (weeklyData?.assignments && weeklyData.assignments.length > 0) {
      for (const ass of weeklyData.assignments) {
        const isAssigned = ass.employees?.some((e) => (typeof e === "object" ? e._id === emp._id : e === emp._id));
        if (isAssigned) {
          return ass.workSchedule?.nom || "Non affecté";
        }
      }
    }
    return "Non affecté";
  };

  const isEmployeeAvailable = (emp) => {
    if (!isEmployeeEnContrat(emp)) return false;
    const currentNom = getEmployeeWeeklyScheduleNom(emp);
    if (currentNom === "Non affecté") return true;
    if (selectedSchedule && currentNom === selectedSchedule.nom) return true;
    return false;
  };

  const toggleSelectEmp = (emp) => {
    if (!isEmployeeEnContrat(emp)) {
      setError(`L'employé ${emp.name} est hors contrat cette semaine.`);
      return;
    }
    const currentNom = getEmployeeWeeklyScheduleNom(emp);
    if (selectedSchedule && currentNom !== "Non affecté" && currentNom !== selectedSchedule.nom) {
      setError(`L'employé ${emp.name} est déjà affecté à l'équipe "${currentNom}" pour cette semaine.`);
      return;
    }
    setSelectedEmpIds((prev) =>
      prev.includes(emp._id) ? prev.filter((id) => id !== emp._id) : [...prev, emp._id]
    );
  };

  const handleAssignEmployees = async () => {
    if (!selectedSchedule) return;
    setAssigning(true);
    setError("");
    setSuccess("");
    try {
      const isoDateStr = toLocalYMD(monday);
      const res = await assignWeeklyEmployees(
        selectedSchedule._id,
        selectedEmpIds,
        isoDateStr
      );
      setSuccess(res.message || "Affectation de la semaine enregistrée !");
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de l'affectation");
    } finally {
      setAssigning(false);
    }
  };

  const allDepts = [...new Set(employees.map((e) => e.department).filter(Boolean))].sort();

  // Employés sous contrat actif pour la semaine sélectionnée
  const contractEmployees = employees.filter(isEmployeeEnContrat);

  // Filtrer la liste des employés par recherche & département
  const filteredEmployees = contractEmployees.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.matricule.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterDept && e.department !== filterDept) return false;
    return true;
  });

  const availableFilteredEmployees = filteredEmployees.filter(isEmployeeAvailable);
  const allAvailableSelected =
    availableFilteredEmployees.length > 0 &&
    availableFilteredEmployees.every((e) => selectedEmpIds.includes(e._id));

  const handleToggleSelectAll = () => {
    if (allAvailableSelected) {
      const availIds = availableFilteredEmployees.map((e) => e._id);
      setSelectedEmpIds((prev) => prev.filter((id) => !availIds.includes(id)));
    } else {
      const availIds = availableFilteredEmployees.map((e) => e._id);
      setSelectedEmpIds((prev) => [...new Set([...prev, ...availIds])]);
    }
  };

  // KPIs de la semaine
  const assignedCustomCount = contractEmployees.filter((e) => getEmployeeWeeklyScheduleNom(e) !== "Non affecté").length;
  const unassignedCount = contractEmployees.length - assignedCustomCount;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress sx={{ color: "#06b6d4" }} />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3} className="animate-fade-in" py={1}>
      {/* Top Banner: Control Center & Week Switcher */}
      <Paper
        elevation={0}
        className="glass-panel-glow"
        sx={{
          p: { xs: 3, md: 3.5 },
          borderRadius: 5,
          background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))",
        }}
      >
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", lg: "center" }} gap={3}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1.5} mb={0.5}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 3,
                  background: "linear-gradient(135deg, #10b981 0%, #0284c7 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AssignmentIndIcon sx={{ color: "#fff", fontSize: 22 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px">
                Planning d'Affectation des Équipes
              </Typography>
            </Stack>
            <Typography variant="body2" color="#94a3b8">
              Gérez les rotations et les régimes d'heures pour chaque employé sous contrat
            </Typography>
          </Box>

          {/* Week Selector Box */}
          <Paper
            elevation={0}
            sx={{
              p: 1,
              px: 2,
              borderRadius: 4,
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <IconButton onClick={handlePrevWeek} size="small" sx={{ color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>
              <ChevronLeftIcon />
            </IconButton>

            <Box textAlign="center" minWidth={200}>
              <Typography variant="caption" color="#34d399" fontWeight={800} letterSpacing="0.5px" display="block">
                SEMAINE SELECTIONNÉE
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color="#f8fafc">
                Lun {formatDateShort(monday)} — Sam {formatDateShort(sunday)}
              </Typography>
            </Box>

            <IconButton onClick={handleNextWeek} size="small" sx={{ color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>
              <ChevronRightIcon />
            </IconButton>

            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(56, 189, 248, 0.2)", my: 0.5 }} />

            <Button
              size="small"
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={handleTodayWeek}
              sx={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.3)", borderRadius: 3, textTransform: "none", fontWeight: 700 }}
            >
              Aujourd'hui
            </Button>
          </Paper>
        </Stack>
      </Paper>

      {/* KPI Cards Row */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Paper className="glass-panel" sx={{ p: 2.5, borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "rgba(2, 132, 199, 0.18)", color: "#38bdf8", width: 46, height: 46 }}>
              <PeopleAltIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>TOTAL EN CONTRAT</Typography>
              <Typography variant="h5" fontWeight={800} color="#f8fafc">{contractEmployees.length}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper className="glass-panel" sx={{ p: 2.5, borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.18)", color: "#34d399", width: 46, height: 46 }}>
              <CheckCircleIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>ÉQUIPES SPÉCIFIQUES</Typography>
              <Typography variant="h5" fontWeight={800} color="#34d399">{assignedCustomCount}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper className="glass-panel" sx={{ p: 2.5, borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: unassignedCount > 0 ? "rgba(245, 158, 11, 0.18)" : "rgba(148, 163, 184, 0.18)", color: unassignedCount > 0 ? "#fbbf24" : "#94a3b8", width: 46, height: 46 }}>
              <LockClockIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>NON AFFECTÉS</Typography>
              <Typography variant="h5" fontWeight={800} color={unassignedCount > 0 ? "#fbbf24" : "#cbd5e1"}>{unassignedCount}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Bar */}
      <Paper elevation={0} className="glass-panel" sx={{ borderRadius: 4, px: 2, pt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            "& .MuiTab-root": {
              color: "#94a3b8",
              fontWeight: 700,
              fontSize: 14,
              textTransform: "none",
              minHeight: 48,
              "&.Mui-selected": { color: "#38bdf8" },
            },
            "& .MuiTabs-indicator": { backgroundColor: "#38bdf8", height: 3, borderRadius: 3 },
          }}
        >
          <Tab icon={<GroupAddIcon />} iconPosition="start" label="1. Module d'Affectation par Équipe" />
          <Tab icon={<TableViewIcon />} iconPosition="start" label={`2. Tableau Récapitulatif (${contractEmployees.length})`} />
        </Tabs>
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

      {/* TAB 0: Affectation Interactive (Côte à côte sans saut de ligne) */}
      {activeTab === 0 && (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: "stretch" }}>
          {/* Bloc 1 : Sélection du Régime d'Équipe (Gauche) */}
          <Box sx={{ width: { xs: "100%", md: "320px", lg: "340px" }, flexShrink: 0 }}>
            <Paper className="glass-panel" sx={{ p: 3.5, borderRadius: 5, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle1" fontWeight={800} color="#f8fafc" mb={0.5}>
                Équipes Disponibles
              </Typography>
              <Typography variant="caption" color="#94a3b8" display="block" mb={2}>
                Cliquez sur une équipe pour charger son staff
              </Typography>
              <Divider sx={{ mb: 2.5, borderColor: "rgba(56, 189, 248, 0.15)" }} />

              <Stack gap={2} flexGrow={1}>
                {schedules.map((sched) => {
                  const isSelected = selectedSchedule && selectedSchedule._id === sched._id;
                  const currentAss = weeklyData?.assignments?.find(
                    (a) => a.workSchedule?._id === sched._id || a.workSchedule === sched._id
                  );
                  const assignedCount = currentAss?.employees?.length || (
                    contractEmployees.filter((e) => getEmployeeWeeklyScheduleNom(e) === sched.nom).length
                  );

                  return (
                    <Paper
                      key={sched._id}
                      onClick={() => setSelectedSchedule(sched)}
                      sx={{
                        p: 2.5,
                        borderRadius: 4,
                        cursor: "pointer",
                        backgroundColor: isSelected ? "rgba(2, 132, 199, 0.18)" : "rgba(30, 41, 59, 0.5)",
                        border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(56, 189, 248, 0.15)",
                        boxShadow: isSelected ? "0 4px 20px rgba(2, 132, 199, 0.3)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#38bdf8" },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                        <Typography variant="subtitle2" fontWeight={800} color={isSelected ? "#38bdf8" : "#f8fafc"}>
                          {sched.nom}
                        </Typography>
                        {sched.estParDefaut && (
                          <Chip label="Par défaut" size="small" sx={{ backgroundColor: "rgba(148, 163, 184, 0.2)", color: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="#94a3b8" display="block" mb={1.5}>
                        {sched.description || "Régime de travail"}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={`${assignedCount} employé(s)`}
                          size="small"
                          sx={{
                            backgroundColor: isSelected ? "rgba(56, 189, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
                            color: isSelected ? "#38bdf8" : "#94a3b8",
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                        {isSelected && <CheckCircleIcon sx={{ color: "#38bdf8", fontSize: 20 }} />}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Paper>
          </Box>

          {/* Bloc 2 : Sélection du Staff (Placé DANS l'espace vide à droite) */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Paper className="glass-panel" sx={{ p: 3.5, borderRadius: 5, height: "100%", display: "flex", flexDirection: "column" }}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} mb={2} gap={2} width="100%">
                <Box flexGrow={1}>
                  <Typography variant="h6" fontWeight={800} color="#f8fafc">
                    Staff pour "{selectedSchedule?.nom || "L'Équipe"}"
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    Cochez le personnel à attribuer à cette équipe cette semaine
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleAssignEmployees}
                  disabled={assigning || !selectedSchedule}
                  startIcon={assigning ? <CircularProgress size={18} color="inherit" /> : <GroupAddIcon />}
                  sx={{
                    ml: "auto",
                    borderRadius: 3,
                    px: 3.5,
                    py: 1.2,
                    fontWeight: 800,
                    textTransform: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                    alignSelf: { xs: "flex-end", sm: "center" },
                  }}
                >
                  {assigning ? "Enregistrement..." : `Valider (${selectedEmpIds.length})`}
                </Button>
              </Stack>

              <Divider sx={{ mb: 2.5, borderColor: "rgba(56, 189, 248, 0.15)" }} />

              {/* Filtres & Recherche */}
              <Grid container spacing={2} mb={2.5} alignItems="center">
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Rechercher par nom ou matricule..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: "#38bdf8", mr: 1, fontSize: 20 }} />,
                      sx: { color: "#f8fafc", borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.5)" },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Département"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    InputLabelProps={{ style: { color: "#94a3b8" } }}
                    InputProps={{ sx: { color: "#f8fafc", borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.5)" } }}
                  >
                    <MenuItem value="">Tous les départements</MenuItem>
                    {allDepts.map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* Contrôle de sélection globale */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                <Button
                  size="small"
                  onClick={handleToggleSelectAll}
                  sx={{ color: "#38bdf8", fontWeight: 700, textTransform: "none" }}
                >
                  {allAvailableSelected ? "Désélectionner tout" : "Sélectionner tous les employés disponibles"}
                </Button>
                <Typography variant="caption" color="#94a3b8">
                  {selectedEmpIds.length} sélectionné(s) sur {filteredEmployees.length} sous contrat
                </Typography>
              </Box>

              {/* Grille des cartes employés */}
              {filteredEmployees.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography color="#94a3b8">
                    Aucun employé sous contrat actif ne correspond à vos critères.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2} sx={{ maxHeight: 500, overflowY: "auto", pr: 1 }}>
                  {filteredEmployees.map((emp) => {
                    const isChecked = selectedEmpIds.includes(emp._id);
                    const isAvail = isEmployeeAvailable(emp);
                    const weeklyNom = getEmployeeWeeklyScheduleNom(emp);

                    return (
                      <Grid item xs={12} sm={6} key={emp._id}>
                        <Paper
                          onClick={() => isAvail && toggleSelectEmp(emp)}
                          sx={{
                            p: 2,
                            borderRadius: 3.5,
                            cursor: isAvail ? "pointer" : "not-allowed",
                            opacity: isAvail ? 1 : 0.65,
                            backgroundColor: isChecked ? "rgba(16, 185, 129, 0.12)" : "rgba(30, 41, 59, 0.5)",
                            border: isChecked
                              ? "2px solid #10b981"
                              : isAvail
                              ? "1px solid rgba(56, 189, 248, 0.15)"
                              : "1px solid rgba(239, 68, 68, 0.2)",
                            transition: "all 0.2s ease",
                            "&:hover": isAvail ? { borderColor: "#10b981" } : {},
                          }}
                        >
                          <Stack direction="row" alignItems="center" gap={1.8}>
                            <Checkbox
                              checked={isChecked}
                              disabled={!isAvail}
                              sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#10b981" } }}
                            />
                            <Avatar
                              src={getPhotoUrl(emp.photo)}
                              sx={{ width: 40, height: 40, border: "2px solid #06b6d4", bgcolor: "rgba(6,182,212,0.2)", color: "#38bdf8", fontWeight: 700 }}
                            >
                              {emp.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Box flexGrow={1} minWidth={0}>
                              <Typography variant="body2" fontWeight={800} color="#f8fafc" noWrap>
                                {emp.name}
                              </Typography>
                              <Typography variant="caption" color="#38bdf8" fontWeight={700} display="block">
                                {emp.matricule} • {emp.department}
                              </Typography>
                              <Typography variant="caption" color="#94a3b8" display="block" mt={0.2} noWrap>
                                Équipe : <span style={{ color: "#f8fafc", fontWeight: 700 }}>{weeklyNom}</span>
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Paper>
          </Box>
        </Box>
      )}

      {/* TAB 1: Tableau Synthèse Récapitulatif du Planning */}
      {activeTab === 1 && (
        <Paper className="glass-panel" sx={{ p: 4, borderRadius: 5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#f8fafc">
                Récapitulatif des Équipes (Semaine du {formatDateShort(monday)} au {formatDateShort(sunday)})
              </Typography>
              <Typography variant="caption" color="#94a3b8">
                Vue d'ensemble de tous les employés sous contrat et de leur affectation d'équipe
              </Typography>
            </Box>
            <Chip label={`${contractEmployees.length} Employés`} color="primary" sx={{ fontWeight: 800 }} />
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { borderBottom: "1px solid rgba(56, 189, 248, 0.2)", color: "#94a3b8", fontWeight: 800 } }}>
                  <TableCell>Employé</TableCell>
                  <TableCell>Matricule</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Équipe Affectée</TableCell>
                  <TableCell align="right">Statut Contrat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contractEmployees.map((emp) => {
                  const teamNom = getEmployeeWeeklyScheduleNom(emp);
                  const isAssigned = teamNom !== "Non affecté";

                  return (
                    <TableRow key={emp._id} sx={{ "& td": { borderBottom: "1px solid rgba(56, 189, 248, 0.1)", color: "#f8fafc" } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Avatar src={getPhotoUrl(emp.photo)} sx={{ width: 34, height: 34, bgcolor: "#0284c7" }}>
                            {emp.name[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={800}>{emp.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="#38bdf8">{emp.matricule}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="#94a3b8">{emp.department || "—"}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={teamNom}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            backgroundColor: isAssigned ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.15)",
                            color: isAssigned ? "#34d399" : "#fbbf24",
                            border: isAssigned ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(245, 158, 11, 0.3)",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label="En contrat" size="small" color="success" sx={{ fontWeight: 800, fontSize: 11 }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
