import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button,
  Grid, MenuItem, Divider, Avatar, Stack, Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { createEmployee } from "../services/employee.service";
import { getDepartments } from "../services/department.service";

export default function AddEmployee() {
  const navigate = useNavigate();

  const [dbDepartments, setDbDepartments] = useState([]);
  const [form, setForm] = useState({
    name: "", cin: "", matricule: "", department: "",
    poste: "", email: "", telephone: "",
    scheduleStartDate: new Date().toISOString().split("T")[0],
    scheduleEndDate: "",
  });

  useEffect(() => {
    getDepartments().then(res => {
      if (res && res.success) {
        setDbDepartments(res.data);
      }
    }).catch(err => console.error("Erreur chargement départements:", err));
  }, []);

  const departmentList = useMemo(() => dbDepartments.map(d => d.name), [dbDepartments]);

  const positionList = useMemo(() => {
    let posList = [];
    const deptStr = (form.department || "").toLowerCase().trim();

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

    if (form.poste && !posList.includes(form.poste)) {
      posList.push(form.poste);
    }

    return posList;
  }, [dbDepartments, form.department, form.poste]);

  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

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
    else if (!/^[24579]\d{7}$/.test(form.telephone)) newErrors.telephone = "Numéro invalide (8 chiffres)";

    if (!form.scheduleStartDate) newErrors.scheduleStartDate = "La date de début de contrat est requise";
    if (!form.scheduleEndDate) newErrors.scheduleEndDate = "La date de fin de contrat est requise";
    else if (new Date(form.scheduleStartDate) > new Date(form.scheduleEndDate)) {
      newErrors.scheduleEndDate = "La date de fin doit être supérieure à la date de début";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      if (photoFile) formData.append("photo", photoFile);
      const newEmployee = await createEmployee(formData);
      navigate(`/employees/${newEmployee._id}`);
    } catch (err) {
      setSubmitError("Erreur lors de l'ajout de l'employé");
    }
  };

  return (
    <Box maxWidth={800} mx="auto" py={3}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/employees")} sx={{ mb: 4, color: "#38bdf8" }}>
        Retour aux employés
      </Button>

      {/* En-tête avec photo */}
      <Paper
        className="glass-panel-glow"
        sx={{
          p: 4, mb: 4,
          background: "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,58,95,0.85) 100%)",
          borderRadius: 5,
        }}
      >
        <Stack direction="row" alignItems="center" gap={3}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Avatar
              src={preview}
              sx={{ width: 90, height: 90, border: "3px solid rgba(56, 189, 248, 0.5)" }}
            />
            <label
              htmlFor="photo-upload"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "2px solid white",
              }}
            >
              <PhotoCameraIcon style={{ fontSize: 18, color: "white" }} />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhoto}
            />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="#f8fafc">
              {form.name || "Nouvel employé"}
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: 14, mt: 0.5 }}>
              {form.poste || "Poste non défini"}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Formulaire */}
      <Paper className="glass-panel" sx={{ p: 5, borderRadius: 5 }}>
        <Typography variant="h6" fontWeight={700} color="#f8fafc" mb={1}>
          Informations Personnelles & Enrôlement
        </Typography>
        <Typography variant="body2" color="#94a3b8" mb={3}>
          Remplissez tous les champs obligatoires pour créer la fiche employé
        </Typography>
        <Divider sx={{ mb: 4, borderColor: "rgba(56, 189, 248, 0.15)" }} />

        {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Nom complet" name="name"
              value={form.name} onChange={handleChange}
              error={!!errors.name} helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="CIN" name="cin"
              value={form.cin} onChange={handleChange}
              error={!!errors.cin} helperText={errors.cin}
              inputProps={{ maxLength: 8 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Matricule" name="matricule"
              value={form.matricule} onChange={handleChange}
              error={!!errors.matricule} helperText={errors.matricule}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth select label="Département" name="department"
              value={form.department} onChange={handleChange}
              error={!!errors.department} helperText={errors.department}
            >
              {departmentList.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth select label="Poste" name="poste"
              value={form.poste} onChange={handleChange}
              error={!!errors.poste} helperText={errors.poste}
            >
              {positionList.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handleChange}
              error={!!errors.email} helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Téléphone" name="telephone"
              value={form.telephone} onChange={handleChange}
              error={!!errors.telephone} helperText={errors.telephone}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Début de contrat" name="scheduleStartDate" type="date"
              value={form.scheduleStartDate || ""} onChange={handleChange}
              error={!!errors.scheduleStartDate} helperText={errors.scheduleStartDate || "Date de début de contrat"}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Fin de contrat" name="scheduleEndDate" type="date"
              value={form.scheduleEndDate || ""} onChange={handleChange}
              error={!!errors.scheduleEndDate} helperText={errors.scheduleEndDate || "Date de fin de contrat (obligatoire)"}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Bouton photo visible dans le formulaire */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              htmlFor="photo-upload"
              startIcon={<PhotoCameraIcon />}
              fullWidth
              sx={{ py: 1.8, borderStyle: "dashed", borderColor: "rgba(56, 189, 248, 0.4)", color: "#38bdf8" }}
            >
              {photoFile ? photoFile.name : "Choisir une photo de profil"}
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "rgba(56, 189, 248, 0.15)" }} />

        <Stack direction="row" justifyContent="flex-end" gap={3}>
          <Button variant="outlined" onClick={() => navigate("/employees")} sx={{ color: "#94a3b8", px: 3 }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              px: 4, py: 1.5,
              background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
            }}
          >
            Ajouter l'employé
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}