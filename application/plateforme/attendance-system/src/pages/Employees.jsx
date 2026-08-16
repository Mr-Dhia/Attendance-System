import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography, Button, Stack, Grid, Paper,
  CircularProgress, Box, Alert, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TablePagination,
  InputAdornment, Tabs, Tab, Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import EmployeeTable from "../components/EmployeeTable";
import { getEmployees, deleteEmployee } from "../services/employee.service";
import { getDepartments } from "../services/department.service";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState(0); // 0 = profils complets, 1 = a completer
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("Tous");
  const [statut, setStatut] = useState("Tous");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch {
      setError("Erreur lors du chargement des employés");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    getDepartments().then(res => {
      if (res && res.success) setDbDepartments(res.data);
    }).catch(() => {});
  }, []);

  const completes = useMemo(() => employees.filter((e) => !e.creeRapide), [employees]);
  const aCompleter = useMemo(() => employees.filter((e) => e.creeRapide), [employees]);
  const currentList = tab === 0 ? completes : aCompleter;

  const departments = useMemo(() => {
    const fromEmp = currentList.map((e) => e.department).filter(Boolean);
    const fromDb = dbDepartments.map((d) => d.name);
    return ["Tous", ...new Set([...fromDb, ...fromEmp])];
  }, [currentList, dbDepartments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return currentList.filter((e) => {
      const matchTerm =
        !term ||
        e.name?.toLowerCase().includes(term) ||
        e.matricule?.toLowerCase().includes(term);
      const matchDept = department === "Tous" || e.department === department;
      const matchStatut = statut === "Tous" || e.statut === statut;
      return matchTerm && matchDept && matchStatut;
    });
  }, [currentList, search, department, statut]);

  useEffect(() => {
    setPage(0);
  }, [search, department, statut, tab]);
  useEffect(() => {
    setDepartment("Tous");
  }, [tab]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteEmployee(toDelete._id);
      setEmployees((prev) => prev.filter((e) => e._id !== toDelete._id));
      setToDelete(null);
    } catch {
      setError("Erreur lors de la suppression de l'employé");
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress sx={{ color: "#06b6d4" }} />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={6} className="animate-fade-in" py={3}>
      {/* 1. Header Hero Banner (With Extreme Right Action Button & Full 4-Sided Padding) */}
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
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={4} width="100%">
          <Box>
            <Typography variant="h4" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px" mb={1.5}>
              Gestion du Personnel & Empreintes
            </Typography>
            <Typography variant="body2" color="#94a3b8">
              Enrôlement biométrique et répertoire centralisé des employés
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<FingerprintIcon />}
            onClick={() => navigate("/employees/add")}
            sx={{
              ml: { sm: "auto" }, // Extreme Right Alignment!
              borderRadius: 4,
              px: 5,
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
            Enrôler un Employé
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", mb: 4 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* 2. Tabs Section FULL WIDTH Menu Container (Not Wrap Content!) */}
      <Box mb={2} width="100%">
        <Paper
          className="glass-panel"
          sx={{
            width: "100%",
            display: "block",
            pt: 2.5,
            pb: 2.5,
            pl: { xs: 3, md: 5 },
            pr: { xs: 3, md: 5 },
            borderRadius: 5,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            variant="fullWidth" // Full Width Menu Tabs!
            sx={{
              width: "100%",
              "& .MuiTabs-indicator": { backgroundColor: "#06b6d4", height: 3, borderRadius: 2 },
              "& .MuiTab-root": { color: "#94a3b8", fontWeight: 800, textTransform: "none", fontSize: 16, py: 1.5 },
              "& .Mui-selected": { color: "#38bdf8 !important" },
            }}
          >
            <Tab label={`Profils Enrôlés (${completes.length})`} />
            <Tab label={`À Completer (${aCompleter.length})`} />
          </Tabs>
        </Paper>
      </Box>

      {/* 3. Filters & Search Form Card (Full 4-Sided Padding: Top, Bottom, Left, Right) */}
      <Box mb={4} width="100%">
        <Paper
          className="glass-panel"
          sx={{
            width: "100%",
            pt: { xs: 4, md: 5 },
            pb: { xs: 4, md: 5 },
            pl: { xs: 4, md: 6 },
            pr: { xs: 4, md: 6 },
            borderRadius: 5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={800} color="#f8fafc" mb={3.5}>
            Recherche & Filtres Avancés
          </Typography>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher par nom ou matricule..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#06b6d4" }} />
                    </InputAdornment>
                  ),
                  sx: { color: "#f8fafc", borderRadius: 3 },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Département"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                InputLabelProps={{ style: { color: "#94a3b8" } }}
                InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
              >
                {departments.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Statut"
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                InputLabelProps={{ style: { color: "#94a3b8" } }}
                InputProps={{ sx: { color: "#f8fafc", borderRadius: 3 } }}
              >
                <MenuItem value="Tous">Tous les statuts</MenuItem>
                <MenuItem value="Actif">Actif</MenuItem>
                <MenuItem value="Inactif">Inactif</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* 4. Employee Table Container (Full 4-Sided Padding) */}
      <Box mb={4} width="100%">
        <EmployeeTable employees={paginated} onDelete={(emp) => setToDelete(emp)} />
      </Box>

      {/* Pagination Section */}
      <Box mb={5} display="flex" justifyContent="flex-end">
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ color: "#94a3b8" }}
        />
      </Box>

      {/* Delete Dialog */}
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        PaperProps={{
          sx: {
            borderRadius: 5,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f8fafc",
            p: 2,
          },
        }}
      >
        <DialogTitle fontWeight={800} sx={{ pt: 3, px: 4 }}>
          Supprimer {toDelete?.name} ?
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <DialogContentText sx={{ color: "#94a3b8" }}>
            Cette action est irréversible et supprimera le profil ainsi que l'enrôlement d'empreinte associé.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 3 }}>
          <Button onClick={() => setToDelete(null)} sx={{ color: "#94a3b8", px: 3 }}>
            Annuler
          </Button>
          <Button onClick={handleConfirmDelete} disabled={deleting} color="error" variant="contained" sx={{ borderRadius: 3, px: 3.5, py: 1.2 }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
