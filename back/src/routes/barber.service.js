import { supabaseAdmin } from "../../supabaseClient.js";
import { DateTime } from "luxon";

const GENERAL_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export const getBarberAvailability = async (barberId) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("extra_data")
    .eq("id", barberId)
    .single();

  if (error) throw error;
  if (!data?.extra_data?.availability) {
    throw new Error("Availability not found for this barber.");
  }
  return data.extra_data.availability;
};

export const getAvailableSlots = async (barberId, date, serviceId) => {
  const [shopSettingsRes, serviceRes] = await Promise.all([
    supabaseAdmin
      .from("general")
      .select("data")
      .eq("id", GENERAL_SETTINGS_ID)
      .single(),
    supabaseAdmin
      .from("services")
      .select("duration_minutes")
      .eq("id", serviceId)
      .single(),
  ]);

  const { data: shopSettings, error: shopSettingsError } = shopSettingsRes;
  if (shopSettingsError && shopSettingsError.code !== "PGRST116") {
    throw shopSettingsError;
  }
  if (shopSettings?.data?.blocked_dates?.includes(date)) {
    return [];
  }

  const { data: service, error: serviceError } = serviceRes;
  if (serviceError || !service) {
    throw new Error("Service not found.");
  }
  const serviceDuration = service.duration_minutes;

  const requestedDate = DateTime.fromISO(date);
  const dayName = requestedDate.toFormat("EEEE").toLowerCase();

  const { data: barberProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("extra_data")
    .eq("id", barberId)
    .single();

  if (profileError || !barberProfile) {
    throw new Error("Barber not found.");
  }

  const barberDayAvailability =
    barberProfile.extra_data?.availability?.[dayName];
  if (!barberDayAvailability || !barberDayAvailability.enabled) {
    return [];
  }

  const { data: appointments, error: appointmentsError } = await supabaseAdmin
    .from("appointments")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("appointment_date", date)
    .in("status", ["Reservado", "En Proceso"]);
  if (appointmentsError) throw appointmentsError;

  const availableSlots = [];
  const { open, close } = barberDayAvailability;
  let currentTime = DateTime.fromISO(`${date}T${open}`);
  const endTime = DateTime.fromISO(`${date}T${close}`);

  while (currentTime.plus({ minutes: serviceDuration }) <= endTime) {
    const slotEnd = currentTime.plus({ minutes: serviceDuration });
    let isBooked = appointments.some(
      (app) =>
        currentTime < DateTime.fromISO(`${date}T${app.end_time}`) &&
        slotEnd > DateTime.fromISO(`${date}T${app.start_time}`)
    );

    if (!isBooked) {
      availableSlots.push(currentTime.toFormat("HH:mm:ss"));
    }
    currentTime = currentTime.plus({ minutes: 15 });
  }

  return availableSlots;
};
