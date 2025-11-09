import { supabaseAdmin } from "../../supabaseClient.js";
import { DateTime } from "luxon";

// @desc    Get availability for a specific barber (public)

// Un UUID fijo y válido para la única fila de configuración general.
const GENERAL_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
// @route   GET /api/barbers/:barberId/availability
// @access  Public
export const getBarberAvailability = async (req, res) => {
  const { barberId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("extra_data")
      .eq("id", barberId)
      .single();

    if (error) throw error;

    if (!data || !data.extra_data || !data.extra_data.availability) {
      return res
        .status(404)
        .json({ message: "Availability not found for this barber." });
    }

    res.status(200).json(data.extra_data.availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available time slots for a barber on a specific date for a given service
// @route   GET /api/barbers/:barberId/available-slots
// @access  Public
export const getAvailableSlots = async (req, res) => {
  const { barberId } = req.params;
  const { date, serviceId } = req.query; // date in "YYYY-MM-DD" format
  console.log(
    `⚙️ [BACKEND] Petición getAvailableSlots para Barbero: ${barberId}, Fecha: ${date}, Servicio: ${serviceId}`
  );

  if (!date || !serviceId) {
    return res
      .status(400)
      .json({ message: "Date and Service ID are required." });
  }

  try {
    // 0. Get shop settings and service duration in parallel
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
      // Ignore "0 rows" error
      throw shopSettingsError;
    }

    if (shopSettings?.data?.blocked_dates?.includes(date)) {
      return res.status(200).json([]); // Shop is closed on this day
    }

    // 1. Get service duration
    console.log("  - (1/4) Obteniendo duración del servicio...");
    const { data: service, error: serviceError } = serviceRes;
    if (serviceError || !service) {
      return res.status(404).json({ message: "Service not found." });
    }
    const serviceDuration = service.duration_minutes;

    // 2. Get barber's working hours for that day
    console.log("  - (2/4) Obteniendo horario del barbero...");
    const requestedDate = DateTime.fromISO(date);
    const dayName = requestedDate.toFormat("EEEE").toLowerCase();

    const { data: barberProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("extra_data")
      .eq("id", barberId)
      .single();

    if (profileError || !barberProfile) {
      return res.status(404).json({ message: "Barber not found." });
    }

    const barberDayAvailability =
      barberProfile.extra_data?.availability?.[dayName];

    if (!barberDayAvailability || !barberDayAvailability.enabled) {
      return res.status(200).json([]); // Barber doesn't work this day, return empty array
    }

    // 3. Get all appointments for the barber on the selected date
    console.log("  - (3/4) Obteniendo turnos existentes para la fecha...");
    const startOfDay = requestedDate.startOf("day").toISO();
    const endOfDay = requestedDate.endOf("day").toISO();

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("start_time, end_time")
      .eq("barber_id", barberId)
      .eq("appointment_date", date)
      .in("status", ["Reservado", "En Proceso"]);

    if (appointmentsError) throw appointmentsError;
    console.log(
      `    - Se encontraron ${appointments.length} turnos existentes.`
    );

    // 4. Calculate available slots
    console.log("  - (4/4) Calculando horarios disponibles...");
    const availableSlots = [];
    const { open, close } = barberDayAvailability;
    // Use a consistent timezone for all calculations to avoid UTC-related issues.
    // By not specifying a zone, Luxon treats the time as "local" to whatever context it's in,
    // avoiding timezone conversions which was the source of the bug.
    let currentTime = DateTime.fromISO(`${date}T${open}`);
    const endTime = DateTime.fromISO(`${date}T${close}`);

    while (currentTime.plus({ minutes: serviceDuration }) <= endTime) {
      const slotEnd = currentTime.plus({ minutes: serviceDuration });
      let isBooked = false;

      for (const app of appointments) {
        const appStart = DateTime.fromISO(`${date}T${app.start_time}`);
        const appEnd = DateTime.fromISO(`${date}T${app.end_time}`);

        // Check for any overlap
        if (currentTime < appEnd && slotEnd > appStart) {
          isBooked = true;
          break;
        }
      }

      if (!isBooked) {
        availableSlots.push(currentTime.toFormat("HH:mm:ss"));
      }

      // Move to the next 15-minute interval to check for a new slot
      currentTime = currentTime.plus({ minutes: 15 });
    }

    console.log(
      `✅ [BACKEND] Cálculo finalizado. Se encontraron ${availableSlots.length} horarios disponibles.`
    );
    res.status(200).json(availableSlots);
  } catch (error) {
    console.error("❌ [BACKEND] Error en getAvailableSlots:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get availability for the authenticated barber
// @route   GET /api/barber/availability
// @access  Private/Barber
export const getAuthenticatedBarberAvailability = async (req, res) => {
  const barberId = req.user.id; // Assuming req.user.id is set by protect middleware

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("extra_data")
      .eq("id", barberId)
      .single();

    if (error) throw error;

    if (!data || !data.extra_data || !data.extra_data.availability) {
      return res
        .status(404)
        .json({ message: "Availability not found for this barber." });
    }

    res.status(200).json(data.extra_data.availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new availability for the authenticated barber
// @route   POST /api/barber/availability
// @access  Private/Barber
// TODO: Rewrite this function to work with the new JSONB data structure in the 'profiles' table.
export const createBarberAvailability = async (req, res) => {
  res.status(501).json({ message: "Not Implemented" });
  /*
  const barberId = req.user.id;
  const { day_of_week, start_time, end_time } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from("barber_availability")
      .insert([{ barber_id: barberId, day_of_week, start_time, end_time }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  */
};

// @desc    Update availability for the authenticated barber
// @route   PUT /api/barber/availability/:id
// @access  Private/Barber
export const updateBarberAvailability = async (req, res) => {
  console.log("\n[BACKEND] 🚀 Endpoint updateBarberAvailability alcanzado.");
  try {
    const barberId = req.user.id;
    // El payload puede contener 'availability' y/o 'blocked_dates'
    const { availability, blocked_dates } = req.body;

    console.log(`[BACKEND] 🧔 ID del barbero: ${barberId}`);
    console.log(
      `[BACKEND] 📥 Datos recibidos en req.body:`,
      JSON.stringify(req.body, null, 2)
    );

    if (!availability && !blocked_dates) {
      console.log(
        "[BACKEND] ⚠️ No se proporcionaron datos de 'availability' ni 'blocked_dates'."
      );
      return res
        .status(400)
        .json({ message: "No availability or blocked dates data provided." });
    }

    console.log("[BACKEND] 🔄 Obteniendo extra_data actual del perfil...");
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("extra_data")
      .eq("id", barberId)
      .single();

    if (fetchError) throw fetchError;

    console.log("[BACKEND] 📄 extra_data actual:", profile.extra_data);

    const newExtraData = {
      ...profile.extra_data,
      availability: availability ?? profile.extra_data?.availability,
      blocked_dates: blocked_dates ?? profile.extra_data?.blocked_dates,
    };

    console.log("[BACKEND] ✨ Nuevos extra_data a guardar:", newExtraData);
    console.log("[BACKEND] ⏳ Actualizando perfil en la base de datos...");
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ extra_data: newExtraData })
      .eq("id", barberId);

    if (updateError) throw updateError;

    console.log("[BACKEND] ✅ Horario actualizado con éxito.");
    res.status(200).json({ message: "Schedule updated successfully." });
  } catch (error) {
    console.error(
      "[BACKEND] 💥 Error al actualizar el horario:",
      error.message
    );
    res.status(500).json({ message: "Failed to update schedule." });
  }
};

// @desc    Delete availability for the authenticated barber
// @route   DELETE /api/barber/availability/:id
// @access  Private/Barber
// TODO: Rewrite this function to work with the new JSONB data structure in the 'profiles' table.
export const deleteBarberAvailability = async (req, res) => {
  res.status(501).json({ message: "Not Implemented" });
  /*
  const { id } = req.params;
  const barberId = req.user.id;

  try {
    const { error } = await supabaseAdmin
      .from("barber_availability")
      .delete()
      .eq("id", id)
      .eq("barber_id", barberId); // Ensure barber can only delete their own availability

    if (error) throw error;

    res
      .status(200)
      .json({ message: "Availability entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  */
};
