import { Paper, Typography, Box, Stack } from "@mui/material";

export default function StatCard({ title, value, sub, color = "#2563eb", icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        color: "white",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 30px ${color}40`,
        },
      }}
    >
      <Box sx={{
        position: "absolute", top: -20, right: -20,
        width: 100, height: 100, borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.1)",
      }} />
      <Box sx={{
        position: "absolute", bottom: -30, right: 20,
        width: 60, height: 60, borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.08)",
      }} />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box minWidth={0}>
          <Typography variant="body2" sx={{ opacity: 0.85, mb: 1 }}>{title}</Typography>
          <Typography variant="h3" fontWeight="bold">{value}</Typography>
          {sub && (
            <Typography variant="caption" sx={{ opacity: 0.75, mt: 0.5, display: "block" }}>
              {sub}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{
            width: 48, height: 48, borderRadius: 2, flexShrink: 0,
            backgroundColor: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {icon}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
