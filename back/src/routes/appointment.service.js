import { supabaseAdmin } from "../../supabaseClient.js";
import { DateTime } from "luxon";

const cleanupPastAppointments = async () => {
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

export const getClientAppointments = async (clientId) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      "*, services(*), barber:profiles!appointments_barber_id_fkey(full_name, avatar_url, phone_number)"
    )
    .eq("client_id", clientId)
    .order("start_time", { ascending: false });
  if (error) throw error;
  return data;
};

export const getBarberAppointments = async (barberId) => {
  await cleanupPastAppointments();
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      "*, services(*), client:profiles!appointments_client_id_fkey(full_name, avatar_url, phone_number)"
    )
    .eq("barber_id", barberId)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data;
};

export const createAppointment = async (appointmentDetails) => {
  const {
    client_id,
    barber_id,
    service_id,
    appointment_date,
    start_time,
    end_time,
  } = appointmentDetails;

  // Validation logic can be extracted here as well
  const requestedStartTime = DateTime.fromISO(
    `${appointment_date}T${start_time}`
  );
  const dayName = requestedStartTime.toFormat("EEEE").toLowerCase();

  const { data: barberProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("extra_data")
    .eq("id", barber_id)
    .single();

  if (profileError || !barberProfile) {
    throw new Error("Barber not found");
  }

  const barberDayAvailability =
    barberProfile.extra_data?.availability?.[dayName];
  if (!barberDayAvailability || !barberDayAvailability.enabled) {
    throw new Error("El barbero no trabaja en el día seleccionado.");
  }

  if (
    start_time < barberDayAvailability.open ||
    end_time > barberDayAvailability.close
  ) {
    throw new Error("La cita está fuera del horario de trabajo del barbero.");
  }

  const { data: overlappingAppointments, error: overlappingError } =
    await supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact" })
      .eq("barber_id", barber_id)
      .eq("appointment_date", appointment_date)
      .in("status", ["Reservado", "En Proceso"])
      .lt("start_time", end_time)
      .gt("end_time", start_time);

  if (overlappingError) throw overlappingError;
  if (overlappingAppointments && overlappingAppointments.count > 0) {
    throw new Error(
      "Este horario ya no está disponible. Por favor, elige otro."
    );
  }

  const { data: serviceData, error: serviceError } = await supabaseAdmin
    .from("services")
    .select("price")
    .eq("id", service_id)
    .single();

  if (serviceError || !serviceData) {
    throw new Error("Service not found");
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert([
      { ...appointmentDetails, price: serviceData.price, status: "Reservado" },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointmentNotes = async (appointmentId, newNotes) => {
  const { data: currentAppointment, error: fetchError } = await supabaseAdmin
    .from("appointments")
    .select("notes")
    .eq("id", appointmentId)
    .single();
  if (fetchError) throw fetchError;

  const updatedNotes = { ...currentAppointment.notes, ...newNotes };
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({ notes: updatedNotes })
    .eq("id", appointmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAppointmentStatus = async (appointmentId, status, user) => {
  // ... logic from controller
};

export const deleteAppointment = async (appointmentId, user) => {
  // ... logic from controller
};
