import { supabaseAdmin } from "../utils/supabase.js";

export const getAllAppointments = async () => {
  const { data, error } = await supabaseAdmin.from("appointments").select(`
      *, 
      services(*), 
      client:client_id (id, full_name, avatar_url), 
      barber:barber_id (id, full_name, avatar_url)
    `);

  if (error) {
    throw error;
  }

  return data;
};

export const getClientAppointments = async (clientId) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      "*, services(*), barber:profiles!appointments_barber_id_fkey(full_name, avatar_url, phone_number)"
    )
    .eq("client_id", clientId)
    .order("start_time", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const getBarberAppointments = async (barberId) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      "*, services(*), client:profiles!appointments_client_id_fkey(full_name, avatar_url, phone_number)"
    )
    .eq("barber_id", barberId)
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

export const getOverlappingAppointments = async (barber_id, appointment_date, start_time, end_time) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id", { count: "exact" })
    .eq("barber_id", barber_id)
    .eq("appointment_date", appointment_date)
    .in("status", ["Reservado", "En Proceso"])
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  if (error) {
    throw error;
  }

  return data;
};

export const createAppointment = async (appointment) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert([appointment])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
};

export const getAppointmentNotes = async (appointmentId) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("notes")
    .eq("id", appointmentId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateAppointmentNotes = async (appointmentId, notes) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({ notes })
    .eq("id", appointmentId)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
};

export const updateAppointmentStatus = async (
  appointmentId,
  status,
  userId,
  userRole
) => {
  let query = supabaseAdmin
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (userRole === "barber") {
    query = query.eq("barber_id", userId);
  }

  const { data, error } = await query.select();

  if (error) {
    throw error;
  }

  return data[0];
};

export const deleteAppointment = async (appointmentId, userId, userRole) => {
  let query = supabaseAdmin.from("appointments").delete().eq("id", appointmentId);

  if (userRole === "user") {
    query = query.eq("client_id", userId);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
};

export const getAppointmentsByBarberAndDate = async (barberId, date) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("appointment_date", date)
    .in("status", ["Reservado", "En Proceso"]);

  if (error) {
    throw error;
  }

  return data;
};