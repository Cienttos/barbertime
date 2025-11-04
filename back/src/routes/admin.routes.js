import express from "express";
import {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  getAllAppointments,
  getAllBarberAvailability,
  getGeneralData,
  updateGeneralData,
} from "../controllers/admin.controller.js";
import {
  getUserStats,
  getAdminStats,
} from "../controllers/stats.controller.js";
import { getServices } from "../controllers/services.controller.js"; // Asumiendo que es para uso interno de admin
import { authenticateUser, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

console.log("✅ [Routes] Admin routes loaded.");

// Rutas que requieren rol de 'admin'
router.route("/users").get(authenticateUser, authorize(["admin"]), getAllUsers);
router
  .route("/users/:id")
  .get(authenticateUser, authorize(["admin"]), getUserDetails);
router
  .route("/users/:id/role")
  .put(authenticateUser, authorize(["admin"]), updateUserRole);
router
  .route("/appointments")
  .get(authenticateUser, authorize(["admin"]), getAllAppointments);
router
  .route("/stats")
  .get(authenticateUser, authorize(["admin"]), getAdminStats); // New route for admin stats
router
  .route("/stats/user/:userId")
  .get(authenticateUser, authorize(["admin"]), getUserStats);

// Se mueve la ruta de servicios aquí y se quita el rol de admin para que los barberos puedan verlos.
// Según TODO.txt, esta ruta debería ser pública o al menos para usuarios logueados.
router.route("/services").get(authenticateUser, getServices);

// Ruta para datos generales: GET para todos los autenticados, PUT solo para admin.
router
  .route("/general")
  .get(authenticateUser, getGeneralData)
  .put(authenticateUser, authorize(["admin"]), updateGeneralData);

export default router;
