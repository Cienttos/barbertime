import {
  getClientAppointments as getClientAppointmentsFromService,
  getBarberAppointments as getBarberAppointmentsFromService,
  createAppointment as createAppointmentFromService,
  updateAppointmentNotes as updateAppointmentNotesFromService,
  updateAppointmentStatus as updateAppointmentStatusFromService,
  deleteAppointment as deleteAppointmentFromService,
} from "../services/appointment.service.js";

// @desc    Get appointments for the authenticated client
// @route   GET /api/appointments/client
// @access  Private/Client
export const getClientAppointments = async (req, res) => {
  const clientId = req.user.id;
  try {
    const data = await getClientAppointmentsFromService(clientId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBarberAppointments = async (req, res) => {
  const barberId = req.user.id;
  try {
    const data = await getBarberAppointmentsFromService(barberId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  const clientId = req.user.id;
  const { barber_id, service_id, appointment_date, start_time, end_time } =
    req.body;
  try {
    const appointment = await createAppointmentFromService({
      client_id: clientId,
      barber_id,
      service_id,
      appointment_date,
      start_time,
      end_time,
    });
    res.status(201).json(appointment);
  } catch (error) {
    if (
      [
        "Barber not found",
        "El barbero no trabaja en el día seleccionado.",
        "La cita está fuera del horario de trabajo del barbero.",
        "Este horario ya no está disponible. Por favor, elige otro.",
        "Service not found",
      ].includes(error.message)
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentNotes = async (req, res) => {
  const { id } = req.params;
  const newNotes = req.body; // e.g., { rating, review_comment, chat }
  try {
    const data = await updateAppointmentNotesFromService(id, newNotes);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user;
  try {
    const data = await updateAppointmentStatusFromService(id, status, user);
    res.status(200).json(data);
  } catch (error) {
    if (
      [
        "Clients are only allowed to cancel appointments.",
        "Appointment not found or not authorized to update",
      ].includes(error.message)
    ) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    await deleteAppointmentFromService(id, user);
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
