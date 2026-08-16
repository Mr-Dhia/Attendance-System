import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  getEmployee,
  updateEmployee,
  removeFingerprint,
} from "../services/employee.service";
import { getAttendance } from "../services/attendance.service";
import { getPhotoUrl } from "../services/api";
import { renderPointagesResume, calculerTempsTotal, minutesTravaillees } from "../utils/attendance";
import StatCard from "../components/StatCard";
import {
  Box, Paper, Avatar, Typography, Divider,
  Grid, Button, Chip, Stack, CircularProgress,
  IconButton, TextField, MenuItem, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WorkIcon from "@mui/icons-material/Work";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import HistoryIcon from "@mui/icons-material/History";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import FilterListIcon from "@mui/icons-material/FilterList";

import { getDepartments } from "../services/department.service";
import { getWeeklyAssignments } from "../services/schedule.service";

const formatDateSafe = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

function EditableField({ icon, label, value, fieldKey, type = "text", options = null, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVal(value || "");
  }, [value]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(fieldKey, val);
      setEditing(false);
    } catch {
      // Handled upstairs
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setVal(value || "");
  };

  return (
    <Box sx={{ p: 2.5, borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" gap={2}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: "rgba(6, 182, 212, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" color="#94a3b8" display="block" fontWeight={600}>{label}</Typography>
            {!editing && (
              <Typography variant="body1" fontWeight={700} color="#f8fafc">{value || "—"}</Typography>
            )}
          </Box>
        </Stack>
        {!editing && (
          <IconButton size="small" onClick={() => setEditing(true)} sx={{ color: "#38bdf8" }}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {editing && (
        <Box mt={2}>
          {options ? (
            <TextField
              fullWidth select size="small" label={label}
              value={val} onChange={(e) => setVal(e.target.value)}
              InputLabelProps={{ style: { color: "#94a3b8" } }}
              InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
            >
              {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
          ) : (
            <TextField
              fullWidth size="small" label={label} type={type}
              value={val} onChange={(e) => setVal(e.target.value)}
              InputLabelProps={type === "date" ? { shrink: true, style: { color: "#94a3b8" } } : { style: { color: "#94a3b8" } }}
              InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
            />
          )}
          <Stack direction="row" justifyContent="flex-end" gap={1} mt={2}>
            <IconButton size="small" onClick={handleCancel} sx={{ color: "#94a3b8" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="primary" onClick={handleSave} disabled={loading} sx={{ color: "#38bdf8" }}>
              {loading ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
            </IconButton>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dbDepartments, setDbDepartments] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getDepartments().then(res => {
      if (res && res.success) setDbDepartments(res.data);
    }).catch(err => console.error("Erreur chargement départements", err));
  }, []);

  const departmentList = useMemo(() => {
    const names = dbDepartments.map(d => d.name);
    if (employee?.department && !names.includes(employee.department)) {
      names.push(employee.department);
    }
    return names;
  }, [dbDepartments, employee?.department]);

  const positionList = useMemo(() => {
    let posList = [];
    const deptStr = (employee?.department || "").toLowerCase().trim();

    const selected = dbDepartments.find(d => 
      d.name.toLowerCase() === deptStr ||
      d.code.toLowerCase() === deptStr ||
      (deptStr && d.name.toLowerCase().includes(deptStr)) ||
      (deptStr && deptStr.includes(d.name.toLowerCase()))
    );

    if (selected && selected.positions && selected.positions.length > 0) {
      posList = selected.positions.map(p => p.title);
    } else {
      dbDepartments.forEach(d => {
        if (d.positions) {
          d.positions.forEach(p => {
            if (!posList.includes(p.title)) posList.push(p.title);
          });
        }
      });
    }

    if (employee?.poste && !posList.includes(employee.poste)) {
      posList.push(employee.poste);
    }

    return posList;
  }, [dbDepartments, employee?.department, employee?.poste]);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [filterDebut, setFilterDebut] = useState("");
  const [filterFin, setFilterFin] = useState("");
  const [refDate, setRefDate] = useState(new Date());

  const [editingEffectDates, setEditingEffectDates] = useState(false);
  const [effectStartDate, setEffectStartDate] = useState("");
  const [effectEndDate, setEffectEndDate] = useState("");
  const [savingEffectDates, setSavingEffectDates] = useState(false);

  const handleSaveEffectDates = async () => {
    setSavingEffectDates(true);
    try {
      const updated = await updateEmployee(id, {
        scheduleStartDate: effectStartDate || null,
        scheduleEndDate: effectEndDate || null,
      });
      setEmployee(updated);
      setEditingEffectDates(false);
      setSuccess("Période d'effet mise à jour avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors de la mise à jour de la période d'effet");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSavingEffectDates(false);
    }
  };

  const toLocalYMD = (date) => {
    if (!date) return "";
    const dt = new Date(date);
    if (isNaN(dt.getTime())) return String(date).split("T")[0];
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMonday = (d) => {
    let dt;
    if (typeof d === "string" && d.includes("-")) {
      const parts = d.split("T")[0].split("-").map(Number);
      dt = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    } else {
      dt = new Date(d);
    }
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(dt.getFullYear(), dt.getMonth(), diff, 0, 0, 0);
    return monday;
  };

  const handleResetFilter = () => {
    setFilterDebut("");
    setFilterFin("");
    setRefDate(new Date());
  };


  const [activeWeeklySchedule, setActiveWeeklySchedule] = useState(null);
  const [weeklyAssignmentsMap, setWeeklyAssignmentsMap] = useState({});

  useEffect(() => {
    if (!employee?._id) return;
    const empIdStr = String(employee._id);

    let rangeStart = refDate;
    let rangeEnd = refDate;
    if (filterDebut) rangeStart = new Date(filterDebut);
    if (filterFin) rangeEnd = new Date(filterFin);

    const startMon = getMonday(rangeStart);
    const endMon = getMonday(rangeEnd);

    const promises = [];
    let curr = new Date(startMon);
    while (curr <= rangeEnd || curr <= endMon) {
      const isoStr = toLocalYMD(curr);
      promises.push(
        getWeeklyAssignments(isoStr).then((res) => ({
          isoStr,
          assignments: res?.assignments || [],
        }))
      );
      curr.setDate(curr.getDate() + 7);
    }

    Promise.all(promises)
      .then((results) => {
        const map = {};
        results.forEach(({ isoStr, assignments }) => {
          const myAss = assignments.find((a) =>
            a.employees?.some((e) => {
              const eIdStr = String(typeof e === "object" ? e?._id || e : e);
              return eIdStr === empIdStr;
            })
          );
          if (myAss) {
            map[isoStr] = myAss.workSchedule;
          } else {
            map[isoStr] = null;
          }
        });
        setWeeklyAssignmentsMap(map);

        const refMonIso = toLocalYMD(getMonday(refDate));
        setActiveWeeklySchedule(map[refMonIso] || null);
      })
      .catch(() => {
        setWeeklyAssignmentsMap({});
        setActiveWeeklySchedule(null);
      });
  }, [refDate, filterDebut, filterFin, employee?._id, employee?.workSchedule]);

  const weekInfo = useMemo(() => {
    let daysList = [];

    if (filterDebut && filterFin) {
      const dStart = new Date(filterDebut);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(filterFin);
      dEnd.setHours(23, 59, 59, 999);

      let curr = new Date(dStart);
      while (curr <= dEnd) {
        daysList.push(new Date(curr));
        curr.setDate(curr.getDate() + 1);
      }
    } else if (filterDebut) {
      const dStart = new Date(filterDebut);
      dStart.setHours(0, 0, 0, 0);
      for (let i = 0; i < 6; i++) {
        const d = new Date(dStart);
        d.setDate(dStart.getDate() + i);
        daysList.push(d);
      }
    } else {
      const monday = getMonday(refDate);
      for (let i = 0; i < 6; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        daysList.push(d);
      }
    }

    const monday = getMonday(refDate);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const todayStr = toLocalYMD(new Date());

    const days = daysList.map((d) => {
      const dateIso = toLocalYMD(d);
      const jsDay = d.getDay();
      const monIso = toLocalYMD(getMonday(d));

      const activeSchedForDay = weeklyAssignmentsMap[monIso] !== undefined
        ? weeklyAssignmentsMap[monIso]
        : (activeWeeklySchedule || null);

      const schedDay = activeSchedForDay?.jours?.find((j) => j.jourIndex === jsDay);

      let inContractPeriod = true;
      if (employee?.scheduleStartDate) {
        const sStart = new Date(employee.scheduleStartDate);
        sStart.setHours(0, 0, 0, 0);
        if (d < sStart) inContractPeriod = false;
      }
      if (employee?.scheduleEndDate) {
        const sEnd = new Date(employee.scheduleEndDate);
        sEnd.setHours(23, 59, 59, 999);
        if (d > sEnd) inContractPeriod = false;
      }

      let inFilterRange = true;
      if (filterDebut) {
        const fStart = new Date(filterDebut);
        fStart.setHours(0, 0, 0, 0);
        if (d < fStart) inFilterRange = false;
      }
      if (filterFin) {
        const fEnd = new Date(filterFin);
        fEnd.setHours(23, 59, 59, 999);
        if (d > fEnd) inFilterRange = false;
      }

      const isActive = inContractPeriod && inFilterRange;

      let durationMinutes = 0;
      if (isActive && schedDay?.estJourOuvre && schedDay?.heureDebut && schedDay?.heureFin) {
        const [hD, mD] = schedDay.heureDebut.split(":").map(Number);
        const [hF, mF] = schedDay.heureFin.split(":").map(Number);
        durationMinutes = Math.max(0, (hF * 60 + mF) - (hD * 60 + mD));
      }

      const isPastDay = dateIso < todayStr;
      const isToday = dateIso === todayStr;

      let isTodayAndPastLimit = false;
      if (isToday && schedDay?.estJourOuvre) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const heureLimStr = schedDay?.heureFinPointage || schedDay?.heureFin || "17:00";
        const [hLim, mLim] = heureLimStr.split(":").map(Number);
        const limiteMins = (hLim || 0) * 60 + (mLim || 0);
        if (currentMins > limiteMins) {
          isTodayAndPastLimit = true;
        }
      }

      // Chercher les pointages pour cette date précise
      const dayLogs = logs.filter((l) => {
        if (!l.timestamp && !l.date) return false;
        const lDate = toLocalYMD(l.timestamp || l.date);
        return lDate === dateIso;
      });

      const dayLog = dayLogs.find((l) => l.statut || (l.pointages && l.pointages.length > 0)) || dayLogs[0];
      const hasScans = dayLog?.pointages && dayLog.pointages.length > 0;
      const isRetard = dayLog?.statut === "Retard";
      const isAbsent = dayLog?.statut === "Absent";
      const firstEntry = dayLog?.pointages?.find((l) => l.type === "entree" || l.type === "ENTREE") || dayLog?.pointages?.[0];
      const lastExit = dayLog?.pointages?.filter((l) => l.type === "sortie" || l.type === "SORTIE").pop();

      let attendanceStatus = "NON_AFFECTE";

      if (!inContractPeriod) {
        attendanceStatus = "HORS_CONTRAT";
      } else if (isAbsent) {
        attendanceStatus = "ABSENT";
      } else if (isRetard) {
        attendanceStatus = "RETARD";
      } else if (dayLog?.statut === "À l'heure" || hasScans) {
        attendanceStatus = "PRESENT";
      } else if ((isPastDay || isTodayAndPastLimit) && activeSchedForDay && schedDay?.estJourOuvre) {
        attendanceStatus = "ABSENT";
      } else if (activeSchedForDay && schedDay?.estJourOuvre && schedDay?.heureDebut && schedDay?.heureFin) {
        attendanceStatus = "AFFECTE";
      } else {
        attendanceStatus = "NON_AFFECTE";
      }

      return {
        date: d,
        dateIso,
        isToday: dateIso === todayStr,
        dayNameShort: d.toLocaleDateString("fr-FR", { weekday: "short" }).toUpperCase(),
        dateFormatted: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        dateLongFormatted: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        schedDay,
        activeSchedForDay,
        inContractPeriod,
        inFilterRange,
        isActive,
        durationMinutes,
        attendanceStatus,
        firstEntry,
        lastExit,
        hasScans,
      };
    });

    const totalMinutesWeek = days.reduce((sum, day) => sum + day.durationMinutes, 0);
    const totalWorkingDaysWeek = days.filter((day) => day.isActive && day.schedDay?.estJourOuvre).length;

    return {
      monday,
      saturday,
      mondayFormatted: monday.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      saturdayFormatted: saturday.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      days,
      totalMinutesWeek,
      totalWorkingDaysWeek,
      totalHoursWeekStr: `${Math.floor(totalMinutesWeek / 60)}h${totalMinutesWeek % 60 > 0 ? String(totalMinutesWeek % 60).padStart(2, "0") : ""}`,
      estimatedMonthlyHours: Math.round((totalMinutesWeek / 60) * 4.33),
    };
  }, [refDate, filterDebut, filterFin, employee, activeWeeklySchedule, logs]);


  const fetchAttendanceLogs = (silencieux = false) => {
    if (!id) return;
    if (!silencieux) setLogsLoading(true);
    getAttendance({ employee: id })
      .then((res) => setLogs(Array.isArray(res) ? res : []))
      .catch(() => setLogs([]))
      .finally(() => {
        if (!silencieux) setLogsLoading(false);
      });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEmployee(id)
      .then((data) => setEmployee(data))
      .catch(() => setEmployee(null))
      .finally(() => setLoading(false));

    fetchAttendanceLogs();

    const interval = setInterval(() => {
      fetchAttendanceLogs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSaveField = async (field, value) => {
    try {
      const formData = new FormData();
      formData.append(field, value);

      if (field === "poste") {
        const parentDept = dbDepartments.find(d => 
          d.positions && d.positions.some(p => p.title.toLowerCase() === value.toLowerCase())
        );
        if (parentDept) {
          formData.append("department", parentDept.name);
        }
      }

      const updated = await updateEmployee(id, formData);
      setEmployee(updated);
      setSuccess("Modification enregistrée");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors de la modification");
      setTimeout(() => setError(""), 3000);
    }
  };
  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const updated = await updateEmployee(id, formData);
      setEmployee(updated);
      setSuccess("Photo mise à jour");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors de la mise à jour de la photo");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRemoveFingerprint = async (fingerID) => {
    try {
      const updated = await removeFingerprint(id, fingerID);
      setEmployee(updated);
      setSuccess("Empreinte retirée");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors du retrait de l'empreinte");
      setTimeout(() => setError(""), 3000);
    }
  };

  const stats = useMemo(() => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const now = new Date();

    const logsFiltres = safeLogs.filter((l) => {
      if (!l?.date) return false;
      const d = new Date(l.date);
      if (isNaN(d.getTime())) return false;

      if (filterDebut && filterFin) {
        const dStart = new Date(filterDebut);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(filterFin);
        dEnd.setHours(23, 59, 59, 999);
        return d >= dStart && d <= dEnd;
      }

      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const minutesTotal = logsFiltres.reduce(
      (acc, l) => acc + (minutesTravaillees(l?.pointages, l?.date)?.minutes || 0), 0
    );

    // Calculer les présences, retards et absences depuis weekInfo.days pour une cohérence 100% parfaite avec l'emploi du temps
    const daysInScope = weekInfo?.days ? weekInfo.days.filter((d) => d.isActive) : [];

    const aLheureCount = daysInScope.filter((d) => d.attendanceStatus === "PRESENT").length;
    const retardsCount = daysInScope.filter((d) => d.attendanceStatus === "RETARD").length;
    const absencesCount = daysInScope.filter((d) => d.attendanceStatus === "ABSENT").length;
    const joursPointesCount = daysInScope.filter((d) => d.hasScans).length;

    return {
      joursPointes: joursPointesCount,
      aLheure: aLheureCount,
      retards: retardsCount,
      absences: absencesCount,
      heuresTexte: `${Math.floor(minutesTotal / 60)}h${minutesTotal % 60 > 0 ? String(minutesTotal % 60).padStart(2, "0") : ""}`,
    };
  }, [logs, filterDebut, filterFin, weekInfo]);

  if (loading) return (
    <Box display="flex" justifyContent="center" py={10}>
      <CircularProgress sx={{ color: "#06b6d4" }} />
    </Box>
  );

  if (!employee) return (
    <Box py={5} className="animate-fade-in">
      <Typography variant="h6" color="#f8fafc" mb={2}>Employé introuvable ou profil supprimé.</Typography>
      <Button onClick={() => navigate("/employees")} startIcon={<ArrowBackIcon />} sx={{ mt: 2, color: "#38bdf8" }}>
        Retour aux employés
      </Button>
    </Box>
  );

  const fingerIDsList = Array.isArray(employee?.fingerIDs) ? employee.fingerIDs : [];
  const safeLogsList = Array.isArray(logs) ? logs : [];

  return (
    <Box maxWidth={950} mx="auto" className="animate-fade-in" py={2}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/employees")} sx={{ mb: 4, color: "#38bdf8" }}>
        Retour aux employés
      </Button>

      {success && <Alert severity="success" sx={{ mb: 3, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399" }} onClose={() => setSuccess("")}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171" }} onClose={() => setError("")}>{error}</Alert>}

      {/* Hero Header Glass Card */}
      <Paper className="glass-panel-glow" sx={{ p: 5, mb: 4, display: "flex", alignItems: "center", gap: 4, borderRadius: 5 }}>
        <Box sx={{ position: "relative", display: "inline-block" }}>
          <Avatar
            src={preview || getPhotoUrl(employee?.photo)}
            sx={{ width: 110, height: 110, border: "3px solid rgba(56, 189, 248, 0.5)", bgcolor: "rgba(6, 182, 212, 0.2)", color: "#38bdf8", fontSize: 40, fontWeight: 700 }}
          >
            {employee?.name?.charAt(0)?.toUpperCase() || "E"}
          </Avatar>
          <label htmlFor="emp-photo" style={{ position: "absolute", bottom: 0, right: 0, width: 34, height: 34, borderRadius: "50%", backgroundColor: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white" }}>
            <PhotoCameraIcon style={{ fontSize: 18, color: "white" }} />
          </label>
          <input id="emp-photo" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </Box>
        <Box flexGrow={1}>
          <Typography variant="h4" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px">{employee?.name || "Employé Inconnu"}</Typography>
          <Typography variant="body1" sx={{ color: "#94a3b8", mb: 2, mt: 0.5 }}>{employee?.poste || "Poste non défini"}</Typography>
          <Stack direction="row" gap={1.5} sx={{ mt: 1 }}>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              let isHors = employee?.statut === "Inactif";
              const sDate = employee?.scheduleStartDate || employee?.createdAt;
              if (sDate) {
                const sStart = new Date(sDate);
                sStart.setHours(0, 0, 0, 0);
                if (today < sStart) isHors = true;
              }
              if (employee?.scheduleEndDate) {
                const sEnd = new Date(employee.scheduleEndDate);
                sEnd.setHours(23, 59, 59, 999);
                if (today > sEnd) isHors = true;
              }
              return (
                <Chip
                  label={isHors ? "Hors contrat" : "En contrat"}
                  size="small"
                  sx={{
                    backgroundColor: !isHors ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: !isHors ? "#34d399" : "#f87171",
                    border: !isHors ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                    fontWeight: 700,
                    px: 1,
                  }}
                />
              );
            })()}
            <Chip label={employee?.department || "Général"} size="small" sx={{ backgroundColor: "rgba(6, 182, 212, 0.15)", color: "#38bdf8", border: "1px solid rgba(6, 182, 212, 0.3)", fontWeight: 700, px: 1 }} />
          </Stack>
        </Box>
      </Paper>

      {/* Block Information Personnelles Glass Card */}
      <Paper className="glass-panel" sx={{ p: 5, borderRadius: 5, mb: 4 }}>
        <Typography variant="h6" fontWeight={800} color="#f8fafc" mb={1}>
          Informations Personnelles & Bio
        </Typography>
        <Typography variant="caption" color="#94a3b8" display="block" mb={3}>
          Cliquez sur le crayon à droite d'un champ pour modifier directement la valeur
        </Typography>
        <Divider sx={{ mb: 4, borderColor: "rgba(56, 189, 248, 0.15)" }} />

        <Grid container spacing={3.5}>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<BadgeIcon fontSize="small" />} label="Matricule" value={employee?.matricule || ""} fieldKey="matricule" onSave={handleSaveField} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<BadgeIcon fontSize="small" />} label="CIN (8 chiffres)" value={employee?.cin || ""} fieldKey="cin" onSave={handleSaveField} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<WorkIcon fontSize="small" />} label="Poste" value={employee?.poste || ""} fieldKey="poste" options={positionList} onSave={handleSaveField} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<BusinessIcon fontSize="small" />} label="Département" value={employee?.department || ""} fieldKey="department" options={departmentList} onSave={handleSaveField} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<CalendarMonthIcon fontSize="small" />} label="Début de contrat" value={formatDateSafe(employee?.scheduleStartDate || employee?.createdAt)} fieldKey="scheduleStartDate" type="date" onSave={handleSaveField} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<CalendarMonthIcon fontSize="small" />} label="Fin de contrat" value={formatDateSafe(employee?.scheduleEndDate)} fieldKey="scheduleEndDate" type="date" onSave={handleSaveField} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<EmailIcon fontSize="small" />} label="Email" value={employee?.email || ""} fieldKey="email" type="email" onSave={handleSaveField} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EditableField icon={<PhoneIcon fontSize="small" />} label="Téléphone" value={employee?.telephone || ""} fieldKey="telephone" onSave={handleSaveField} />
          </Grid>

          {/* Empreintes digitales Glass Card */}
          <Grid item xs={12}>
            <Box sx={{ p: 3, borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
              <Stack direction="row" alignItems="center" gap={2} mb={2}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: "rgba(6, 182, 212, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FingerprintIcon />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#f8fafc">
                    Empreintes Digitales Enrôlées ({fingerIDsList.length})
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    ID capteur associés au profil
                  </Typography>
                </Box>
              </Stack>

              {fingerIDsList.length === 0 ? (
                <Typography variant="body2" color="#64748b">Aucune empreinte digitale associée à ce profil</Typography>
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1.5} mt={1}>
                  {fingerIDsList.map((fid) => (
                    <Chip
                      key={fid}
                      label={`Sensor #01 — ID ${fid}`}
                      size="small"
                      onDelete={() => handleRemoveFingerprint(fid)}
                      sx={{
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        fontWeight: 700,
                        py: 0.8, px: 1,
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau de bord du mois Glass Card */}
      <Paper className="glass-panel" sx={{ p: 5, borderRadius: 5, mb: 4 }}>
        <Typography variant="h6" fontWeight={800} color="#f8fafc" mb={1}>
          Statistiques de Présence — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Typography>
        <Divider sx={{ mb: 3.5, borderColor: "rgba(56, 189, 248, 0.15)" }} />

        {logsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} sx={{ color: "#06b6d4" }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Heures travaillées"
                value={stats.heuresTexte}
                sub={`${stats.joursPointes} jour${stats.joursPointes > 1 ? "s" : ""} pointé${stats.joursPointes > 1 ? "s" : ""}`}
                color="#7c3aed"
                icon={<AccessTimeIcon sx={{ color: "white" }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="À l'heure"
                value={stats.aLheure}
                color="#16a34a"
                icon={<CheckCircleIcon sx={{ color: "white" }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Retards"
                value={stats.retards}
                color="#d97706"
                icon={<AccessTimeIcon sx={{ color: "white" }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Absences"
                value={stats.absences}
                color="#dc2626"
                icon={<CancelIcon sx={{ color: "white" }} />}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* ── Emploi du Temps Visuel ── */}
      <Paper className="glass-panel" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5, mb: 4 }}>
        {/* Header: Title & Regime Badge */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={3} mb={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#f8fafc">
              Emploi du Temps Hebdomadaire
            </Typography>
            <Typography variant="caption" color="#94a3b8">
              Planning de travail avec dates effectives et filtres
            </Typography>
          </Box>

          {activeWeeklySchedule ? (
            <Chip
              icon={<WorkIcon sx={{ fontSize: 16, color: "#38bdf8 !important" }} />}
              label={activeWeeklySchedule.nom}
              sx={{ backgroundColor: "rgba(2,132,199,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)", fontWeight: 700, px: 1.5, py: 0.5 }}
            />
          ) : (
            <Chip
              icon={<WorkIcon sx={{ fontSize: 16, color: "#94a3b8 !important" }} />}
              label="Non affecté cette semaine"
              sx={{ backgroundColor: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)", fontWeight: 700, px: 1.5, py: 0.5 }}
            />
          )}
        </Stack>

        {/* Période d'effet dynamique (Suit les filtres de dates) */}
        {employee?.workSchedule && (
          <Box sx={{ p: 1.5, px: 2.5, borderRadius: 3, backgroundColor: "rgba(15,23,42,0.6)", border: "1px solid rgba(56,189,248,0.15)", mb: 3 }}>
            <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                Période d'effet :
              </Typography>

              <Chip
                size="small"
                icon={<CalendarMonthIcon sx={{ fontSize: 14, color: "#38bdf8 !important" }} />}
                label={
                  filterDebut
                    ? `Du ${new Date(filterDebut).toLocaleDateString("fr-FR")}`
                    : employee.scheduleStartDate
                    ? `Du ${new Date(employee.scheduleStartDate).toLocaleDateString("fr-FR")}`
                    : `Du ${weekInfo.mondayFormatted}`
                }
                sx={{ backgroundColor: "rgba(2,132,199,0.12)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)", fontWeight: 700 }}
              />

              <Chip
                size="small"
                icon={<CalendarMonthIcon sx={{ fontSize: 14, color: "#a5b4fc !important" }} />}
                label={
                  filterFin
                    ? `Au ${new Date(filterFin).toLocaleDateString("fr-FR")}`
                    : employee.scheduleEndDate
                    ? `Au ${new Date(employee.scheduleEndDate).toLocaleDateString("fr-FR")}`
                    : `Au ${weekInfo.saturdayFormatted}`
                }
                sx={{ backgroundColor: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(165,180,252,0.25)", fontWeight: 700 }}
              />

              {(filterDebut || filterFin) && (
                <Chip
                  size="small"
                  label="Filtre actif"
                  sx={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", fontWeight: 800 }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Barre de contrôle : Filtres par dates & Navigation par semaine */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, backgroundColor: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(56, 189, 248, 0.2)", mb: 3.5 }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems="center" gap={3}>
            {/* Filtre début & Fin */}
            <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
              <TextField
                label="Date début"
                type="date"
                size="small"
                value={filterDebut}
                onChange={(e) => setFilterDebut(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: 165,
                  "& .MuiInputLabel-root": { color: "#94a3b8", fontWeight: 700, fontSize: 13 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    color: "#f8fafc",
                    fontSize: 13,
                    fontWeight: 600,
                    "& fieldset": { borderColor: "rgba(56, 189, 248, 0.25)" },
                    "&:hover fieldset": { borderColor: "#38bdf8" },
                    "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
                  },
                  "& input::-webkit-calendar-picker-indicator": {
                    filter: "invert(0.7) sepia(100%) saturate(1000%) hue-rotate(170deg)",
                    cursor: "pointer",
                  },
                }}
              />

              <Typography
                variant="caption"
                fontWeight={800}
                color="#38bdf8"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  mx: 1.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(2, 132, 199, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  alignSelf: "center",
                  mt: 0.2,
                }}
              >
                au
              </Typography>

              <TextField
                label="Date fin"
                type="date"
                size="small"
                value={filterFin}
                onChange={(e) => setFilterFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: 165,
                  "& .MuiInputLabel-root": { color: "#94a3b8", fontWeight: 700, fontSize: 13 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    color: "#f8fafc",
                    fontSize: 13,
                    fontWeight: 600,
                    "& fieldset": { borderColor: "rgba(56, 189, 248, 0.25)" },
                    "&:hover fieldset": { borderColor: "#38bdf8" },
                    "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
                  },
                  "& input::-webkit-calendar-picker-indicator": {
                    filter: "invert(0.7) sepia(100%) saturate(1000%) hue-rotate(170deg)",
                    cursor: "pointer",
                  },
                }}
              />

              {(filterDebut || filterFin) && (
                <Button
                  size="small"
                  onClick={handleResetFilter}
                  sx={{
                    mt: 0.2,
                    ml: 2,
                    color: "#f87171",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 12,
                    px: 1.5,
                    py: 0.25,
                    borderRadius: 2,
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.22)" },
                  }}
                >
                  Effacer
                </Button>
              )}
            </Stack>

            {/* Navigation Semaine */}
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ ml: { lg: "auto" } }}>
              <IconButton
                size="small"
                onClick={() => setRefDate((prev) => new Date(prev.getTime() - 7 * 86400000))}
                sx={{ color: "#38bdf8", backgroundColor: "rgba(2,132,199,0.15)", "&:hover": { backgroundColor: "rgba(2,132,199,0.3)" } }}
              >
                <ChevronLeftIcon />
              </IconButton>

              <Typography variant="body2" fontWeight={800} color="#f8fafc" sx={{ px: 2, minWidth: 200, textAlign: "center" }}>
                Semaine du {weekInfo.mondayFormatted} au {weekInfo.saturdayFormatted}
              </Typography>

              <IconButton
                size="small"
                onClick={() => setRefDate((prev) => new Date(prev.getTime() + 7 * 86400000))}
                sx={{ color: "#38bdf8", backgroundColor: "rgba(2,132,199,0.15)", "&:hover": { backgroundColor: "rgba(2,132,199,0.3)" } }}
              >
                <ChevronRightIcon />
              </IconButton>

              <Button
                size="small"
                startIcon={<TodayIcon />}
                onClick={handleResetFilter}
                sx={{ ml: 2, color: "#38bdf8", textTransform: "none", fontWeight: 700, backgroundColor: "rgba(2,132,199,0.1)", px: 2, borderRadius: 2 }}
              >
                Aujourd'hui
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Divider sx={{ mb: 3, borderColor: "rgba(56, 189, 248, 0.15)" }} />

        {(!activeWeeklySchedule && !employee?.workSchedule) ? (
          <Box sx={{ py: 5, textAlign: "center", borderRadius: 3, backgroundColor: "rgba(30,41,59,0.4)", border: "1px dashed rgba(56,189,248,0.2)" }}>
            <AccessTimeIcon sx={{ fontSize: 36, color: "#334155", mb: 1.5 }} />
            <Typography variant="body2" color="#64748b">
              Aucun horaire de travail assigné à cet employé.
            </Typography>
            <Typography variant="caption" color="#475569">
              Accédez à la page <strong>Horaires</strong> pour effectuer une affectation.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Grille Jours filtrés par date (Affiche les jours du filtre + statut Hors contrat) */}
            {weekInfo.days.filter((d) => d.inFilterRange).length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", borderRadius: 3, backgroundColor: "rgba(30,41,59,0.3)", border: "1px dashed rgba(255,255,255,0.1)", mb: 3.5 }}>
                <Typography variant="body2" color="#64748b">
                  Aucun jour d'horaire dans la plage de date sélectionnée.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  gap: 2,
                  mb: 3.5,
                  pb: 1.5,
                  width: "100%",
                  scrollBehavior: "smooth",
                  "&::-webkit-scrollbar": {
                    height: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "rgba(15, 23, 42, 0.5)",
                    borderRadius: 4,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(56, 189, 248, 0.3)",
                    borderRadius: 4,
                    "&:hover": {
                      backgroundColor: "#38bdf8",
                    },
                  },
                }}
              >
                {weekInfo.days.filter((d) => d.inFilterRange).map((d) => (
                <Paper
                  key={d.dateIso}
                  elevation={0}
                  sx={{
                    minWidth: { xs: 130, sm: 145, md: 150 },
                    flexShrink: 0,
                    flexGrow: weekInfo.days.filter((d) => d.inFilterRange).length <= 6 ? 1 : 0,
                    p: 2,
                    borderRadius: 3.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backgroundColor: d.isToday
                      ? "rgba(2, 132, 199, 0.22)"
                      : !d.inContractPeriod
                      ? "rgba(239, 68, 68, 0.08)"
                      : d.schedDay?.estJourOuvre
                      ? "rgba(15, 23, 42, 0.85)"
                      : "rgba(15, 23, 42, 0.4)",
                    border: d.isToday
                      ? "2px solid #38bdf8"
                      : !d.inContractPeriod
                      ? "1px solid rgba(239, 68, 68, 0.25)"
                      : d.schedDay?.estJourOuvre
                      ? "1px solid rgba(56, 189, 248, 0.3)"
                      : "1px solid rgba(255, 255, 255, 0.05)",
                    boxShadow: d.isToday ? "0 0 15px rgba(56, 189, 248, 0.35)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  {/* Header : Jour & Date du jour */}
                  <Box textAlign="center" mb={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" fontWeight={900} color={d.isToday ? "#38bdf8" : d.isActive ? "#cbd5e1" : "#475569"}>
                        {d.dayNameShort}
                      </Typography>
                      {d.isToday && (
                        <Chip label="Auj." size="small" sx={{ height: 16, fontSize: 9, fontWeight: 900, backgroundColor: "#0284c7", color: "#fff" }} />
                      )}
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={800} color={d.isActive ? "#f8fafc" : "#64748b"} fontSize={15}>
                      {d.dateFormatted}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 1.5, borderColor: d.isToday ? "rgba(56, 189, 248, 0.4)" : "rgba(255,255,255,0.06)" }} />

                  {/* Heures & Statut */}
                  <Box textAlign="center" my="auto" py={1}>
                    {!d.inContractPeriod ? (
                      <Chip label="Hors contrat" size="small" sx={{ fontSize: 10, backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }} />
                    ) : !d.inFilterRange ? (
                      <Chip label="Masqué" size="small" sx={{ fontSize: 10, backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }} />
                    ) : d.attendanceStatus === "PRESENT" ? (
                      <>
                        <Chip label="Présent" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 800, backgroundColor: "rgba(16,185,129,0.18)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", mb: 1.2 }} />
                        <Typography variant="body2" fontWeight={800} color="#34d399" display="block">
                          {d.firstEntry?.heure || d.firstEntry?.time || d.schedDay?.heureDebut || "Pointé"}
                        </Typography>
                        <Typography variant="caption" color="#64748b" display="block" fontSize={10}>à</Typography>
                        <Typography variant="body2" fontWeight={800} color="#34d399" display="block">
                          {d.lastExit?.heure || d.lastExit?.time || d.schedDay?.heureFin || "Service OK"}
                        </Typography>
                      </>
                    ) : d.attendanceStatus === "RETARD" ? (
                      <>
                        <Chip label="Retard" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 800, backgroundColor: "rgba(245,158,11,0.18)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", mb: 1.2 }} />
                        <Typography variant="body2" fontWeight={800} color="#fbbf24" display="block">
                          {d.firstEntry?.heure || d.firstEntry?.time || "Scan retard"}
                        </Typography>
                        <Typography variant="caption" color="#64748b" display="block" fontSize={10}>à</Typography>
                        <Typography variant="body2" fontWeight={800} color="#f8fafc" display="block">
                          {d.lastExit?.heure || d.lastExit?.time || d.schedDay?.heureFin || "--:--"}
                        </Typography>
                      </>
                    ) : d.attendanceStatus === "ABSENT" ? (
                      <>
                        <Chip label="Absent" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 800, backgroundColor: "rgba(239, 68, 68, 0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", mb: 1.2 }} />
                        <Typography variant="caption" color="#f87171" display="block" fontStyle="italic" py={0.5}>
                          Aucun pointage
                        </Typography>
                      </>
                    ) : d.attendanceStatus === "AFFECTE" ? (
                      <>
                        <Chip label="Affecté" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 800, backgroundColor: "rgba(2,132,199,0.18)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)", mb: 1.2 }} />

                        {/* Horaires début / fin */}
                        <Typography variant="body2" fontWeight={800} color="#f8fafc" display="block">
                          {d.schedDay.heureDebut}
                        </Typography>
                        <Typography variant="caption" color="#64748b" display="block" fontSize={10}>à</Typography>
                        <Typography variant="body2" fontWeight={800} color="#f8fafc" display="block">
                          {d.schedDay.heureFin}
                        </Typography>

                        {/* Durée calculée */}
                        <Box sx={{ mt: 1.2, pt: 0.8, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                          <Typography variant="caption" fontWeight={800} color="#38bdf8">
                            {Math.floor(d.durationMinutes / 60)}h{d.durationMinutes % 60 > 0 ? String(d.durationMinutes % 60).padStart(2, "0") : ""}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Chip label="Non affecté" size="small" sx={{ fontSize: 10, backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b" }} />
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

            {/* Total / Summary Footer (100% largeur avec CSS Grid) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(3, 1fr)" },
                gap: 2,
                width: "100%",
              }}
            >
              <Box sx={{ px: 2.5, py: 1.5, borderRadius: 3, backgroundColor: "rgba(2,132,199,0.12)", border: "1px solid rgba(56,189,248,0.25)" }}>
                <Typography variant="caption" color="#94a3b8" display="block" fontWeight={600}>Jours travaillés (semaine)</Typography>
                <Typography variant="h6" fontWeight={800} color="#38bdf8">{weekInfo.totalWorkingDaysWeek} jours</Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 1.5, borderRadius: 3, backgroundColor: "rgba(99,102,241,0.12)", border: "1px solid rgba(165,180,252,0.25)" }}>
                <Typography variant="caption" color="#94a3b8" display="block" fontWeight={600}>Total heures (semaine)</Typography>
                <Typography variant="h6" fontWeight={800} color="#a5b4fc">{weekInfo.totalHoursWeekStr}</Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 1.5, borderRadius: 3, backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <Typography variant="caption" color="#94a3b8" display="block" fontWeight={600}>Estimation mensuelle</Typography>
                <Typography variant="h6" fontWeight={800} color="#34d399">{weekInfo.estimatedMonthlyHours}h</Typography>
              </Box>
            </Box>
          </>
        )}
      </Paper>

      {/* Historique des pointages Glass Card */}
      <Paper className="glass-panel" sx={{ p: 5, borderRadius: 5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={800} color="#f8fafc">
            Historique Récents des Pointages
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<HistoryIcon fontSize="small" />}
            onClick={() => navigate(`/attendance?employee=${id}`)}
            sx={{ borderRadius: 3, textTransform: "none", color: "#38bdf8" }}
          >
            Voir tout dans Présences
          </Button>
        </Stack>
        <Divider sx={{ mb: 3.5, borderColor: "rgba(56, 189, 248, 0.15)" }} />

        {logsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} sx={{ color: "#06b6d4" }} />
          </Box>
        ) : safeLogsList.length === 0 ? (
          <Typography variant="body2" color="#64748b" textAlign="center" py={4}>
            Aucun pointage enregistré pour cet employé.
          </Typography>
        ) : (
          <TableContainer component={Paper} className="glass-panel" sx={{ borderRadius: 4, overflow: "hidden", p: 0 }}>
            <Table size="small">
              <TableHead sx={{ background: "rgba(30, 41, 59, 0.85)" }}>
                <TableRow>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700, borderColor: "rgba(56, 189, 248, 0.15)" }}>Date</TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700, borderColor: "rgba(56, 189, 248, 0.15)" }}>Pointages</TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700, borderColor: "rgba(56, 189, 248, 0.15)" }}>Temps total</TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 700, borderColor: "rgba(56, 189, 248, 0.15)" }}>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeLogsList.slice(0, 10).map((log) => {
                  const { texte, enCours } = calculerTempsTotal(log?.pointages, log?.date);
                  return (
                    <TableRow key={log?._id || Math.random()} hover sx={{ borderColor: "rgba(56, 189, 248, 0.1)" }}>
                      <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", color: "#f8fafc", fontWeight: 600 }}>
                        {log?.date ? new Date(log.date).toLocaleDateString("fr-FR") : "—"}
                      </TableCell>
                      <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", color: "#38bdf8" }}>
                        {renderPointagesResume(log?.pointages)}
                      </TableCell>
                      <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)" }}>
                        <Chip
                          label={enCours ? `${texte} (en cours)` : texte}
                          size="small"
                          sx={{
                            backgroundColor: enCours ? "rgba(6, 182, 212, 0.18)" : "rgba(255,255,255,0.05)",
                            color: enCours ? "#38bdf8" : "#cbd5e1",
                            border: enCours ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid rgba(255,255,255,0.1)",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)" }}>
                        <Chip
                          label={log?.statut || "Actif"}
                          size="small"
                          sx={{
                            backgroundColor:
                              log?.statut === "À l'heure"
                                ? "rgba(16, 185, 129, 0.15)"
                                : log?.statut === "Retard"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                            color:
                              log?.statut === "À l'heure"
                                ? "#34d399"
                                : log?.statut === "Retard"
                                ? "#fbbf24"
                                : "#f87171",
                            border:
                              log?.statut === "À l'heure"
                                ? "1px solid rgba(16, 185, 129, 0.3)"
                                : log?.statut === "Retard"
                                ? "1px solid rgba(245, 158, 11, 0.3)"
                                : "1px solid rgba(239, 68, 68, 0.3)",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}