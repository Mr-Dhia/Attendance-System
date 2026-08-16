import { Chip, Stack, Typography } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

export const statusColorMap = {
  "À l'heure": "#10b981",
  "Retard": "#f59e0b",
  "Absent": "#ef4444",
};

export function statusColor(statut) {
  if (typeof statut === "string") {
    return statusColorMap[statut] || "#38bdf8";
  }
  return statusColorMap;
}

export function renderPointagesResume(pointages) {
  if (!pointages || pointages.length === 0) {
    return <Typography variant="body2" color="text.secondary">—</Typography>;
  }
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5}>
      {pointages.map((p, i) => (
        <Chip
          key={i}
          size="small"
          icon={p.type === "entree" ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
          label={p.heure}
          color={p.type === "entree" ? "success" : "default"}
          variant={p.type === "entree" ? "filled" : "outlined"}
        />
      ))}
    </Stack>
  );
}

// Retourne le nombre de minutes travaillees a partir des pointages entree/sortie d'une journee.
export function minutesTravaillees(pointages, dateLog) {
  if (!pointages || pointages.length === 0) return { minutes: 0, enCours: false };

  const toMinutes = (heure) => {
    if (!heure) return 0;
    const [h, m] = heure.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  let totalMinutes = 0;
  let enCours = false;

  for (let i = 0; i < pointages.length; i++) {
    if (pointages[i].type === "entree") {
      const sortieSuivante = pointages[i + 1];

      if (sortieSuivante && sortieSuivante.type === "sortie") {
        totalMinutes += toMinutes(sortieSuivante.heure) - toMinutes(pointages[i].heure);
        i++; // saute la sortie deja traitee
      } else {
        const dateObj = dateLog ? new Date(dateLog) : new Date();
        const estAujourdhui = dateObj.toDateString() === new Date().toDateString();
        if (estAujourdhui) {
          const maintenant = new Date();
          const minutesMaintenant = maintenant.getHours() * 60 + maintenant.getMinutes();
          totalMinutes += minutesMaintenant - toMinutes(pointages[i].heure);
          enCours = true;
        }
      }
    }
  }

  return { minutes: Math.max(totalMinutes, 0), enCours };
}

export function calculerTempsTotal(pointages, dateLog) {
  if (!pointages || pointages.length === 0) return { texte: "—", enCours: false };

  const { minutes, enCours } = minutesTravaillees(pointages, dateLog);
  if (minutes <= 0 && !enCours) return { texte: "—", enCours: false };

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const minStr = m < 10 ? `0${m}` : `${m}`;

  return { texte: `${h}h${minStr}`, enCours };
}
