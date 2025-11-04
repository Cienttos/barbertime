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
router
  .route("/barber/availability")
  .get(
    authenticateUser,
    authorize(["barber"]),
    getAuthenticatedBarberAvailability
  )
  .post(authenticateUser, authorize(["barber"]), createBarberAvailability);

router
  .route("/barber/availability/:id")
  .put(authenticateUser, authorize(["barber"]), updateBarberAvailability)
  .delete(authenticateUser, authorize(["barber"]), deleteBarberAvailability);

export default router;
