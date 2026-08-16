import { Box } from "@mui/material";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    

      <Box sx={{ flexGrow: 1 }}>
        <Navbar />

        <Box
          sx={{
            p: 4,
            mt: "70px",
            minHeight: "100vh",
          }}
        >
          {children}
        </Box>
      </Box>
  );
}