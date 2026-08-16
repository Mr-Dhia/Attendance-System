import { useState, useEffect } from "react";
import { getUser, toggleTwoFactor } from "../services/auth.service";
import api, { getPhotoUrl } from "../services/api";
import {
  Box, Paper, Typography, Avatar, Divider,
  Stack, Chip, Alert, IconButton, TextField,
  CircularProgress, Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import SecurityIcon from "@mui/icons-material/Security";
import { stringToColor, getInitial } from "../utils/avatar";

function EditableField({ icon, label, value, fieldKey, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPassword = fieldKey === "password";

  useEffect(() => {
    setVal(value);
  }, [value]);

  const handleSave = async () => {
    if (isPassword) {
      if (!currentPassword) { setError("Veuillez saisir votre mot de passe actuel"); return; }
      if (!val) { setError("Veuillez saisir un nouveau mot de passe"); return; }
      if (val.length < 6) { setError("Minimum 6 caractères"); return; }
      if (val !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    }
    setLoading(true);
    try {
      await onSave(fieldKey, val, currentPassword);
      setEditing(false);
      setError("");
      if (isPassword) { setVal(""); setConfirm(""); setCurrentPassword(""); }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setVal(value);
    setConfirm("");
    setCurrentPassword("");
    setError("");
  };

  return (
    <Box sx={{ p: 2.5, borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexGrow: 1 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: "rgba(2, 132, 199, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" color="#94a3b8" display="block" fontWeight={600}>{label}</Typography>
            {!editing && (
              <Typography variant="body2" fontWeight={700} color="#f8fafc">
                {isPassword ? "••••••••" : value}
              </Typography>
            )}
          </Box>
        </div>
        {!editing && (
          <IconButton size="small" onClick={() => setEditing(true)} sx={{ color: "#38bdf8" }}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {editing && (
        <Box mt={2} display="flex" flexDirection="column" gap={1.5}>
          {isPassword && (
            <TextField
              fullWidth size="small"
              label="Mot de passe actuel"
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
            />
          )}
          <TextField
            fullWidth size="small"
            label={isPassword ? "Nouveau mot de passe" : label}
            type={isPassword ? "password" : "text"}
            value={val}
            onChange={(e) => { setVal(e.target.value); setError(""); }}
          />
          {isPassword && (
            <TextField
              fullWidth size="small"
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            />
          )}
          {error && <Typography variant="caption" color="#f87171">{error}</Typography>}
          <Stack direction="row" justifyContent="flex-end" gap={1}>
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

export default function Profile() {
  const [user, setUser] = useState(getUser());
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await api.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const photoPath = res.data?.photo || res.data?.user?.photo || res.data?.avatar;
      const currentUser = getUser() || {};
      const updatedUser = { ...currentUser, photo: photoPath || currentUser.photo };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("user-updated"));

      setSuccess("Photo mise à jour");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors de la mise à jour de la photo");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSaveField = async (field, value, currentPassword) => {
    const formData = new FormData();
    if (field === "password") {
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", value);
    } else {
      formData.append(field, value);
    }
    const res = await api.put("/auth/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const currentUser = getUser() || {};
    const updatedUser = { ...currentUser, [field]: value };
    if (res.data?.user) {
      Object.assign(updatedUser, res.data.user);
    }
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event("user-updated"));

    setSuccess("Profil mis à jour avec succès");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleToggleTwoFactor = async () => {
    try {
      const res = await toggleTwoFactor();
      setTwoFactorEnabled(res.twoFactorEnabled);
      const currentUser = getUser() || {};
      const updatedUser = { ...currentUser, twoFactorEnabled: res.twoFactorEnabled };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("user-updated"));
    } catch {
      // error handling
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3} className="animate-fade-in" maxWidth={700} mx="auto" py={2}>
      <Typography variant="h4" fontWeight={800} color="#f8fafc" letterSpacing="-0.5px">
        Mon Profil & Sécurité
      </Typography>

      {success && (
        <Alert severity="success" sx={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
          {error}
        </Alert>
      )}

      <Paper className="glass-panel" sx={{ p: 4, borderRadius: 4 }}>
        <Stack alignItems="center" spacing={2} mb={4}>
          {/* Avatar box with camera button attached directly onto the avatar image */}
          <Box sx={{ position: "relative", display: "inline-block", width: 110, height: 110 }}>
            <Avatar
              src={preview || getPhotoUrl(user?.photo)}
              sx={{
                width: 110,
                height: 110,
                bgcolor: stringToColor(user?.name || "Admin"),
                border: "3px solid #0284c7",
                boxShadow: "0 0 25px rgba(2, 132, 199, 0.4)",
                fontSize: 38,
                fontWeight: 700,
              }}
            >
              {getInitial(user?.name)}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "#0284c7",
                color: "white",
                border: "2px solid #0f172a",
                width: 32,
                height: 32,
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                "&:hover": { backgroundColor: "#0369a1" },
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 16 }} />
              <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
            </IconButton>
          </Box>

          <Box textAlign="center" mt={1}>
            <Typography variant="h6" fontWeight={800} color="#f8fafc">{user?.name || "Administrateur"}</Typography>
            <Typography variant="body2" color="#94a3b8">{user?.email}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3, borderColor: "rgba(56, 189, 248, 0.15)" }} />

        <Stack spacing={2}>
          <EditableField
            icon={<PersonIcon />}
            label="Nom complet"
            value={user?.name || ""}
            fieldKey="name"
            onSave={handleSaveField}
          />

          <EditableField
            icon={<EmailIcon />}
            label="Adresse Email"
            value={user?.email || ""}
            fieldKey="email"
            onSave={handleSaveField}
          />

          <EditableField
            icon={<LockIcon />}
            label="Mot de passe"
            value=""
            fieldKey="password"
            onSave={handleSaveField}
          />

          <Box sx={{ p: 2.5, borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexGrow: 1 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SecurityIcon />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="#f8fafc">Authentification 2FA</Typography>
                <Typography variant="caption" color="#94a3b8">Exiger un code OTP par e-mail lors de la connexion</Typography>
              </Box>
            </div>
            <Switch checked={twoFactorEnabled} onChange={handleToggleTwoFactor} color="primary" />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}