import { supabaseAdmin } from "../../supabaseClient.js";
import { DateTime } from "luxon";

// Helper function to cancel past-due appointments
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

// @desc    Get appointments for the authenticated client
// @route   GET /api/appointments/client
// @access  Private/Client
export const getClientAppointments = async (req, res) => {
  const clientId = req.user.id;

  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(
        "*, services(*), barber:profiles!appointments_barber_id_fkey(full_name, avatar_url, phone_number)"
      )
      .eq("client_id", clientId)
      .order("start_time", { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointments for the authenticated barber
// @route   GET /api/appointments/barber
// @access  Private/Barber
export const getBarberAppointments = async (req, res) => {
  const barberId = req.user.id;

  try {
    // Perform cleanup before fetching data
    await cleanupPastAppointments();

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(
        "*, services(*), client:profiles!appointments_client_id_fkey(full_name, avatar_url, phone_number)"
      )
      .eq("barber_id", barberId)
      .order("start_time", { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private/Client
export const createAppointment = async (req, res) => {
  const clientId = req.user.id;
  const { barber_id, service_id, appointment_date, start_time, end_time } =
    req.body;
  console.log(
    `⚙️ [BACKEND] Petición createAppointment recibida de Cliente: ${clientId}`
  );
  console.log("  - Datos recibidos:", req.body);

  try {
    // --- VALIDATION ---
    // 1. Check if the barber is available based on their personal schedule in profiles.extra_data
    console.log("  - (1/4) Validando disponibilidad del barbero...");
    const requestedDate = DateTime.fromISO(appointment_date);
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
      return res.status(404).json({ message: "Barber not found" });
    }

    const barberDayAvailability =
      barberProfile.extra_data?.availability?.[dayName];
    if (!barberDayAvailability || !barberDayAvailability.enabled) {
      return res
        .status(400)
        .json({ message: "El barbero no trabaja en el día seleccionado." });
    }

    const barberOpens = barberDayAvailability.open;
    const barberCloses = barberDayAvailability.close;

    if (start_time < barberOpens || end_time > barberCloses) {
      return res.status(400).json({
        message: "La cita está fuera del horario de trabajo del barbero.",
      });
    }

    // 2. Check for overlapping appointments
    console.log("  - (2/4) Validando superposición de turnos...");
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
      return res.status(409).json({
        message: "Este horario ya no está disponible. Por favor, elige otro.",
      }); // 409 Conflict
    }

    // 3. Get the service price to store it with the appointment
    console.log("  - (3/4) Obteniendo precio del servicio...");
    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("price")
      .eq("id", service_id)
      .single();

    if (serviceError || !serviceData) {
      return res.status(404).json({ message: "Service not found" });
    }
    const appointmentPrice = serviceData.price;

    console.log("  - (4/4) Insertando nuevo turno en la base de datos...");
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert([
        {
          client_id: clientId,
          barber_id,
          service_id,
          start_time,
          end_time,
          appointment_date,
          price: appointmentPrice, // Save the price at booking time
          status: "Reservado", // Estado inicial
        },
      ])
      .select();

    if (error) throw error;

    console.log("✅ [BACKEND] Turno creado exitosamente:", data[0].id);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("❌ [BACKEND] Error en createAppointment:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment notes (rating, review, chat)
// @route   PUT /api/appointments/:id/notes
// @access  Private
export const updateAppointmentNotes = async (req, res) => {
  const { id } = req.params;
  const newNotes = req.body; // e.g., { rating, review_comment, chat }

  try {
    // First, get the current notes
    const { data: currentAppointment, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select("notes")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Merge new notes with existing notes
    const updatedNotes = { ...currentAppointment.notes, ...newNotes };

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ notes: updatedNotes })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status (by barber or admin)
// @route   PUT /api/appointments/:id/status
// @access  Private/Barber or Admin
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user;
  const userRole = user.profile?.role || "client";

  console.log(
    `[updateStatus] 🔄 Solicitud para actualizar turno ${id} a estado "${status}" por usuario ${user.id} con rol ${userRole}.`
  );

  try {
    // Add security check: clients can only set status to 'Cancelado'
    if (userRole === "client" && status !== "Cancelado") {
      console.log(
        `[updateStatus] ❌ DENEGADO: Cliente intentó cambiar estado a "${status}".`
      );
      return res
        .status(403)
        .json({ message: "Clients are only allowed to cancel appointments." });
    }

    let query = supabaseAdmin
      .from("appointments")
      .update({ status })
      .eq("id", id);

    // Barbers can only update their own assigned appointments
    if (userRole === "barber") {
      query = query.eq("barber_id", user.id);
    }
    // Admins can update any appointment, no additional filter needed

    const { data, error } = await query.select();

    if (error) {
      console.error(
        `[updateStatus] ❌ Error de Supabase al actualizar:`,
        error.message
      );
      throw error;
    }

    if (data.length === 0) {
      console.warn(
        `[updateStatus] ⚠️ No se encontró el turno ${id} o el usuario no está autorizado.`
      );
      return res
        .status(404)
        .json({ message: "Appointment not found or not authorized to update" });
    }

    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an appointment (by client or admin)
// @route   DELETE /api/appointments/:id
// @access  Private/Client or Admin
export const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.profile?.role || "client";

  try {
    let query = supabaseAdmin.from("appointments").delete().eq("id", id);

    // Clients can only delete their own appointments, check for 'user' or 'client' for safety
    if (userRole === "user") {
      query = query.eq("client_id", userId);
    }
    // Admins can delete any appointment, no additional filter needed

    const { error } = await query;

    if (error) throw error;

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
