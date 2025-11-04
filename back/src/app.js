import express from "express";
import cors from "cors";
import "dotenv/config";
import os from "os"; // Added for network interfaces

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js"; // Importar las rutas de perfil
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js"; // <-- IMPORTACIÓN FALTANTE
import barberAvailabilityRoutes from "./routes/barberAvailability.routes.js";
import statsRoutes from "./routes/stats.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("🚀 Backend is running"); // Updated message
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/barbers", barberAvailabilityRoutes); // Changed to /api/barbers for consistency
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  // Updated to listen on all interfaces
  const interfaces = os.networkInterfaces();
  let addresses = [];

  for (let iface in interfaces) {
    for (let i = 0; i < interfaces[iface].length; i++) {
      const addr = interfaces[iface][i];
      if (addr.family === "IPv4" && !addr.internal) {
        addresses.push(addr.address);
      }
    }
  }

  console.log("Servidor corriendo en:");
  console.log(`- Localhost: http://localhost:${PORT}`);
  addresses.forEach((ip) =>
    console.log(`- En red local: http://${ip}:${PORT}`)
  );
});
