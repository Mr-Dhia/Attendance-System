import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import Sidebar, { drawerWidth } from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#090d16" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: "#090d16",
          borderLeft: { md: "6px solid rgba(56, 189, 248, 0.08)" },
        }}
      >
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <Box
          p={{ xs: 2, sm: 3, md: 4 }}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, flexGrow: 1 }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
