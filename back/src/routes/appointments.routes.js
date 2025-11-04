import express from "express";
import {
  getClientAppointments,
  getBarberAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  updateAppointmentNotes,
} from "../controllers/appointments.controller.js";
import { authenticateUser, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Client routes
router.route("/client").get(authenticateUser, getClientAppointments);
router.route("/").post(authenticateUser, createAppointment);
router.route("/:id").delete(authenticateUser, deleteAppointment); // Client can delete their own appointment
router.route("/:id/notes").put(authenticateUser, updateAppointmentNotes); // For rating, chat, etc.

// Barber routes
router
  .route("/barber")
  .get(authenticateUser, authorize(["barber"]), getBarberAppointments);
router.route("/:id/status").put(authenticateUser, updateAppointmentStatus); // Permitir que clientes autenticados accedan

export default router;
