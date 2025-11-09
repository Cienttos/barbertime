import express from "express";
import {
  getBarberAvailability,
  getAuthenticatedBarberAvailability,
  createBarberAvailability,
  updateBarberAvailability,
  deleteBarberAvailability,
  getAvailableSlots,
} from "../controllers/barberAvailability.controller.js";
import { authenticateUser, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route to get available slots for a barber
router.route("/:barberId/available-slots").get(getAvailableSlots);

// Public route to get a specific barber's availability
router.route("/:barberId/availability").get(getBarberAvailability);

// Private routes for authenticated barbers to manage their own availability
// SIMPLIFICADO: Se unifican las rutas GET, POST y PUT bajo /availability
router
  .route("/availability")
  .get(
    authenticateUser,
    authorize(["barber"]),
    getAuthenticatedBarberAvailability
  )
  .post(authenticateUser, authorize(["barber"]), createBarberAvailability)
  .put(authenticateUser, authorize(["barber"]), updateBarberAvailability); // Se mueve PUT aquí

export default router;
