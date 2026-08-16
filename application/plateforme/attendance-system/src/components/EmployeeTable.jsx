import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton,
  Avatar, Box, Typography, Chip, Tooltip, Stack, Paper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { getPhotoUrl } from "../services/api";

function StatutChip({ employee }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isHorsContrat = employee?.statut === "Inactif";

  const startDate = employee?.scheduleStartDate || employee?.createdAt;
  if (startDate) {
    const sStart = new Date(startDate);
    sStart.setHours(0, 0, 0, 0);
    if (today < sStart) isHorsContrat = true;
  }
  if (employee?.scheduleEndDate) {
    const sEnd = new Date(employee.scheduleEndDate);
    sEnd.setHours(23, 59, 59, 999);
    if (today > sEnd) isHorsContrat = true;
  }

  const label = isHorsContrat ? "Hors contrat" : "En contrat";

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: !isHorsContrat ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
        color: !isHorsContrat ? "#34d399" : "#f87171",
        border: !isHorsContrat ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
        fontWeight: 700,
        fontSize: 12,
        px: 1.5,
        py: 0.5,
        borderRadius: 3,
      }}
    />
  );
}

export default function EmployeeTable({ employees, onDelete }) {
  const navigate = useNavigate();

  if (employees.length === 0) {
    return (
      <Paper className="glass-panel" sx={{ py: 8, textAlign: "center", borderRadius: 5 }}>
        <Typography color="#94a3b8" fontSize={16}>
          Aucun employé ne correspond à ces critères d'enrôlement.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} className="glass-panel" sx={{ borderRadius: 5, overflow: "hidden", p: 0 }}>
      <Table sx={{ minWidth: 700 }}>
        <TableHead sx={{ background: "rgba(30, 41, 59, 0.85)" }}>
          <TableRow>
            <TableCell sx={{ color: "#94a3b8", fontWeight: 800, borderColor: "rgba(56, 189, 248, 0.15)", py: 3, px: 4 }}>Employé</TableCell>
            <TableCell sx={{ color: "#94a3b8", fontWeight: 800, borderColor: "rgba(56, 189, 248, 0.15)", py: 3, px: 4 }}>Matricule Bio</TableCell>
            <TableCell sx={{ color: "#94a3b8", fontWeight: 800, borderColor: "rgba(56, 189, 248, 0.15)", py: 3, px: 4 }}>CIN</TableCell>
            <TableCell sx={{ color: "#94a3b8", fontWeight: 800, borderColor: "rgba(56, 189, 248, 0.15)", py: 3, px: 4 }}>Département</TableCell>
            <TableCell sx={{ color: "#94a3b8", fontWeight: 800, borderColor: "rgba(56, 189, 248, 0.15)", py: 3, px: 4 }}>Empreinte ID</TableCell>
            <TableCell sx={{ color: "#94a3b8", fontWeight: 800, borderColor: "rgba(56, 189, 248, 0.15)", py: 3, px: 4 }}>Statut</TableCell>
            <TableCell align="right" sx={{ color: "#94a3b8", fontWeight: 800, borderColor: "rgba(56, 189, 248, 0.15)", py: 3, px: 4 }}>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {employees.map((employee) => (
            <TableRow
              key={employee._id}
              hover
              onClick={() =>
                navigate(employee.creeRapide ? `/employees/${employee._id}/complete` : `/employees/${employee._id}`)
              }
              sx={{
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(6, 182, 212, 0.08) !important" },
                borderColor: "rgba(56, 189, 248, 0.1)",
              }}
            >
              <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", py: 2.8, px: 4 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={getPhotoUrl(employee.photo)}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: "rgba(6, 182, 212, 0.2)",
                      border: "2px solid #06b6d4",
                      color: "#38bdf8",
                      fontWeight: 700,
                    }}
                  >
                    {employee.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box minWidth={0}>
                    <Box display="flex" alignItems="center" gap={1.2}>
                      <Typography variant="body1" fontWeight={700} color="#f8fafc">
                        {employee.name}
                      </Typography>
                      {employee.creeRapide && (
                        <Tooltip title="Créé depuis la borne, profil à compléter">
                          <Chip
                            label="À compléter"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(245, 158, 11, 0.15)",
                              color: "#fbbf24",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              fontWeight: 700,
                              fontSize: 10,
                              px: 1,
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    {employee.email && (
                      <Typography variant="caption" color="#94a3b8" mt={0.3} display="block">
                        {employee.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>

              <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", fontWeight: 700, py: 2.8, px: 4 }}>
                {employee.matricule}
              </TableCell>

              <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", color: "#f8fafc", fontWeight: 700, py: 2.8, px: 4 }}>
                {employee.cin || "—"}
              </TableCell>

              <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", color: "#f8fafc", py: 2.8, px: 4 }}>
                {employee.department || "Non spécifié"}
              </TableCell>

              <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", py: 2.8, px: 4 }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <FingerprintIcon sx={{ fontSize: 18, color: "#10b981" }} />
                  <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 700, fontSize: 13 }}>
                    Enrôlé (Sensor #01)
                  </Typography>
                </Stack>
              </TableCell>

              <TableCell sx={{ borderColor: "rgba(56, 189, 248, 0.1)", py: 2.8, px: 4 }}>
                <StatutChip employee={employee} />
              </TableCell>

              <TableCell align="right" sx={{ borderColor: "rgba(56, 189, 248, 0.1)", py: 2.8, px: 4 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mx: 1 }}>
                  <Tooltip title={employee.creeRapide ? "Compléter le profil" : "Modifier"}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(employee.creeRapide ? `/employees/${employee._id}/complete` : `/employees/${employee._id}/edit`);
                      }}
                      sx={{ color: "#38bdf8" }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(employee);
                      }}
                      sx={{ color: "#f87171" }}
                    >
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
  );
}
