import { supabaseAdmin } from "../utils/supabase.js";
import { DateTime } from "luxon";
import * as appointmentRepository from "../repositories/appointment.repository.js";
import * as barberRepository from "../repositories/barber.repository.js";

export const cleanupPastAppointments = async () => {
  const today = DateTime.now().toISODate();
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ status: "Cancelado" })
    .lt("appointment_date", today)
    .in("status", ["Reservado", "En Proceso"]);

  if (error) {
    console.error("❌ Error during past appointments cleanup:", error.message);
  }
};

export const getAllAppointments = async () => {
  return await appointmentRepository.getAllAppointments();
};

export const getClientAppointments = async (clientId) => {
  return await appointmentRepository.getClientAppointments(clientId);
};

export const getBarberAppointments = async (barberId) => {
  await cleanupPastAppointments();
  return await appointmentRepository.getBarberAppointments(barberId);
};

export const createAppointment = async (appointmentData) => {
  const { barber_id, appointment_date, start_time, end_time } = appointmentData;

  const barberProfile = await barberRepository.getBarberProfile(barber_id);
  if (!barberProfile) {
    throw new Error("Barber not found");
  }

  const requestedStartTime = DateTime.fromISO(
    `${appointment_date}T${start_time}`
  );
  const dayName = requestedStartTime.toFormat("EEEE").toLowerCase();

  const barberDayAvailability = barberProfile.extra_data?.availability?.[dayName];
  if (!barberDayAvailability || !barberDayAvailability.enabled) {
    throw new Error("El barbero no trabaja en el día seleccionado.");
  }

  const barberOpens = barberDayAvailability.open;
  const barberCloses = barberDayAvailability.close;

  if (start_time < barberOpens || end_time > barberCloses) {
    throw new Error("La cita está fuera del horario de trabajo del barbero.");
  }

  const overlappingAppointments =
    await appointmentRepository.getOverlappingAppointments(
      barber_id,
      appointment_date,
      start_time,
      end_time
    );

  if (overlappingAppointments && overlappingAppointments.length > 0) {
    throw new Error("Este horario ya no está disponible. Por favor, elige otro.");
  }

  return await appointmentRepository.createAppointment(appointmentData);
};

export const updateAppointmentNotes = async (appointmentId, newNotes) => {
  const currentAppointment = await appointmentRepository.getAppointmentNotes(
    appointmentId
  );
  const updatedNotes = { ...currentAppointment.notes, ...newNotes };
  return await appointmentRepository.updateAppointmentNotes(
    appointmentId,
    updatedNotes
  );
};

export const updateAppointmentStatus = async (
  appointmentId,
  status,
  user
) => {
  const userRole = user.profile?.role || "client";

  if (userRole === "client" && status !== "Cancelado") {
    throw new Error("Clients are only allowed to cancel appointments.");
  }

  const data = await appointmentRepository.updateAppointmentStatus(
    appointmentId,
    status,
    user.id,
    userRole
  );

  if (!data) {
    throw new Error("Appointment not found or not authorized to update");
  }

  return data;
};

export const deleteAppointment = async (appointmentId, user) => {
  const userRole = user.profile?.role || "client";
  await appointmentRepository.deleteAppointment(appointmentId, user.id, userRole);
};
