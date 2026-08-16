import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button,
  Grid, MenuItem, Divider, Avatar, Stack, Alert, CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import { getEmployee, updateEmployee } from "../services/employee.service";
import { getPhotoUrl } from "../services/api";
import { getDepartments } from "../services/department.service";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dbDepartments, setDbDepartments] = useState([]);
  const [form, setForm] = useState({
    name: "", cin: "", matricule: "", department: "",
    poste: "", email: "", telephone: "",
    statut: "Actif",
    fingerID: "",
  });

  useEffect(() => {
    getDepartments().then(res => {
      if (res && res.success) {
        setDbDepartments(res.data);
      }
    }).catch(err => console.error("Erreur chargement départements:", err));
  }, []);

  const departmentList = useMemo(() => {
    const names = dbDepartments.map(d => d.name);
    if (form.department && !names.includes(form.department)) {
      names.push(form.department);
    }
    return names;
  }, [dbDepartments, form.department]);

  const positionList = useMemo(() => {
    let posList = [];
    const deptStr = (form.department || "").toLowerCase().trim();

    // Recherche souple du département par nom ou code
    const selected = dbDepartments.find(d => 
      d.name.toLowerCase() === deptStr ||
      d.code.toLowerCase() === deptStr ||
      (deptStr && d.name.toLowerCase().includes(deptStr)) ||
      (deptStr && deptStr.includes(d.name.toLowerCase()))
    );

    if (selected && selected.positions && selected.positions.length > 0) {
      posList = selected.positions.map(p => p.title);
    } else {
      // Si aucun département spécifique trouvé, lister TOUS les postes de TOUS les départements
      dbDepartments.forEach(d => {
        if (d.positions) {
          d.positions.forEach(p => {
            if (!posList.includes(p.title)) posList.push(p.title);
          });
        }
      });
    }

    if (form.poste && !posList.includes(form.poste)) {
      posList.push(form.poste);
    }

    return posList;
  }, [dbDepartments, form.department, form.poste]);

  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployee(id)
      .then((employee) => {
        setForm({
          name: employee.name || "",
          matricule: employee.matricule || "",
          department: employee.department || "",
          poste: employee.poste || "",
          email: employee.email || "",
          telephone: employee.telephone || "",
          scheduleStartDate: employee.scheduleStartDate ? new Date(employee.scheduleStartDate).toISOString().split("T")[0] : "",
          scheduleEndDate: employee.scheduleEndDate ? new Date(employee.scheduleEndDate).toISOString().split("T")[0] : "",
          fingerID: employee.fingerID ?? "",
        });
        setCurrentPhoto(employee.photo || "");
      })
      .catch(() => setSubmitError("Employé introuvable"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "department") {
      setForm((prev) => ({ ...prev, department: value, poste: "" }));
    } else if (name === "poste") {
      const parentDept = dbDepartments.find(d => 
        d.positions && d.positions.some(p => p.title.toLowerCase() === value.toLowerCase())
      );
      if (parentDept) {
        setForm((prev) => ({ ...prev, poste: value, department: parentDept.name }));
      } else {
        setForm((prev) => ({ ...prev, poste: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "", department: "", poste: "" }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name) newErrors.name = "Le nom est requis";
    else if (!/^[A-Za-zÀ-ÿ\s'-]{2,60}$/.test(form.name)) newErrors.name = "Nom invalide";

    if (!form.matricule) newErrors.matricule = "Le matricule est requis";
    else if (!/^[A-Za-z0-9]{3,15}$/.test(form.matricule)) newErrors.matricule = "Matricule invalide";

    if (!form.cin) newErrors.cin = "Le CIN est requis";
    else if (!/^\d{8}$/.test(form.cin)) newErrors.cin = "Le CIN doit contenir 8 chiffres";

    if (!form.department) newErrors.department = "Le département est requis";
    if (!form.poste) newErrors.poste = "Le poste est requis";

    if (!form.email) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email invalide";

    if (!form.telephone) newErrors.telephone = "Le téléphone est requis";
    if (!form.scheduleStartDate) newErrors.scheduleStartDate = "La date de début de contrat est requise";
    if (!form.scheduleEndDate) newErrors.scheduleEndDate = "La date de fin de contrat est requise";
    else if (new Date(form.scheduleStartDate) > new Date(form.scheduleEndDate)) {
      newErrors.scheduleEndDate = "La date de fin doit être supérieure à la date de début";
    }

    return newErrors;
  };

  const parseBackendError = (message) => {
    const lower = (message || "").toLowerCase();
    const fieldErrors = {};

    if (lower.includes("cin")) {
      fieldErrors.cin = message;
    } else if (lower.includes("email") || lower.includes("mail")) {
      fieldErrors.email = message;
    } else if (lower.includes("telephone") || lower.includes("téléphone") || lower.includes("phone")) {
      fieldErrors.telephone = message;
    } else if (lower.includes("matricule")) {
      fieldErrors.matricule = message;
    } else if (lower.includes("date") || lower.includes("contrat")) {
      fieldErrors.scheduleEndDate = message;
    } else if (lower.includes("nom") || lower.includes("name")) {
      fieldErrors.name = message;
    }

    return fieldErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitError("");
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      if (photoFile) formData.append("photo", photoFile);
      await updateEmployee(id, formData);
      navigate(`/employees/${id}`);
    } catch (err) {
      const backendField = err.response?.data?.field;
      const exactMessage = err.response?.data?.message || err.message || "Erreur lors de la modification";

      if (backendField) {
        setErrors((prev) => ({ ...prev, [backendField]: exactMessage }));
      } else {
        const fieldErrors = parseBackendError(exactMessage);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        } else {
          setSubmitError(exactMessage);
        }
      }
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" mt={5}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box maxWidth={750} mx="auto">
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/employees/${id}`)} sx={{ mb: 3 }}>
        Retour au profil
      </Button>

      {/* En-tête */}
      <Paper sx={{ p: 3, mb: 3, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" gap={3}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Avatar
              src={preview || getPhotoUrl(currentPhoto)}
              sx={{ width: 90, height: 90, border: "3px solid rgba(255,255,255,0.3)" }}
            />
            <label htmlFor="photo-upload" style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: "50%", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white" }}>
              <PhotoCameraIcon style={{ fontSize: 16, color: "white" }} />
            </label>
            <input id="photo-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="white">
              {form.name || "Employé"}
            </Typography>
            <Typography sx={{ opacity: 0.7, color: "white", fontSize: 14 }}>
              {form.poste || "Poste non défini"}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Formulaire */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Modifier les informations
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

        <Grid container spacing={3.5}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nom complet" name="name" value={form.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="CIN" name="cin" value={form.cin} onChange={handleChange} error={!!errors.cin} helperText={errors.cin} inputProps={{ maxLength: 8 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Matricule" name="matricule" value={form.matricule} onChange={handleChange} error={!!errors.matricule} helperText={errors.matricule} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Département" name="department" value={form.department} onChange={handleChange} error={!!errors.department} helperText={errors.department}>
              {departmentList.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Poste" name="poste" value={form.poste} onChange={handleChange} error={!!errors.poste} helperText={errors.poste}>
              {positionList.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} error={!!errors.telephone} helperText={errors.telephone} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Début de contrat" name="scheduleStartDate" type="date"
              value={form.scheduleStartDate || ""} onChange={handleChange} InputLabelProps={{ shrink: true }}
              error={!!errors.scheduleStartDate} helperText={errors.scheduleStartDate || "Date de début de contrat (obligatoire)"}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Fin de contrat" name="scheduleEndDate" type="date"
              value={form.scheduleEndDate || ""} onChange={handleChange} InputLabelProps={{ shrink: true }}
              error={!!errors.scheduleEndDate} helperText={errors.scheduleEndDate || "Date de fin de contrat (obligatoire)"}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID Empreinte digitale"
              name="fingerID"
              type="number"
              value={form.fingerID}
              onChange={handleChange}
              helperText="ID renvoyé par le capteur lors de l'enrôlement"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => navigate(`/employees/${id}`)}>
            Annuler
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSubmit}>
            Enregistrer
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}