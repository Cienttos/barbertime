import { supabaseAdmin } from "../../supabaseClient.js";

// Un UUID fijo y válido para la única fila de configuración general.
const GENERAL_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

// Obtiene la información general de la tienda
export const getShopInfo = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("general") // Corregido: la tabla se llama 'general'
      .select("data")
      .eq("id", GENERAL_SETTINGS_ID)
      .single();
    if (error && error.code !== "PGRST116") throw error; // Ignorar si no hay filas
    res.status(200).json(data?.data || {}); // Devolver el objeto de datos o uno vacío
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la información de la tienda.",
      error: error.message,
    });
  }
};

// Obtiene todos los usuarios con el rol de 'barber'
export const getBarbers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "barber");
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener los barberos.",
      error: error.message,
    });
  }
};

// Obtiene todos los servicios disponibles
export const getServices = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener los servicios.",
      error: error.message,
    });
  }
};

// Obtiene los horarios disponibles para un barbero en una fecha específica
export const getAvailableSlotsForBarber = async (req, res) => {
  const { barberId } = req.params;
  const { date, serviceId } = req.query;

  if (!date || !serviceId) {
    return res
      .status(400)
      .json({ message: "La fecha y el ID del servicio son requeridos." });
  }

  try {
    // 1. Obtener el perfil del barbero y la duración del servicio en paralelo
    const [barberRes, serviceRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("extra_data").eq("id", barberId).single(),
      supabaseAdmin.from("services").select("duration_minutes").eq("id", serviceId).single(),
    ]);

    if (barberRes.error) throw new Error("Barbero no encontrado.");
    if (serviceRes.error) throw new Error("Servicio no encontrado.");

    const availability = barberRes.data.extra_data?.availability;
    const serviceDuration = serviceRes.data.duration_minutes;

    // 2. Determinar el horario de trabajo para el día seleccionado
    const dayOfWeek = new Date(date).getUTCDay(); // 0=Domingo, 1=Lunes...
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][dayOfWeek];

    const workingHours = availability?.[dayName];
    if (!workingHours || !workingHours.enabled) {
      return res.status(200).json([]); // El barbero no trabaja ese día
    }

    // 3. Obtener los turnos ya reservados para ese barbero en esa fecha
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("start_time, end_time")
      .eq("barber_id", barberId)
      .eq("appointment_date", date)
      .in("status", ["Reservado", "En Proceso"]); // Solo contar turnos activos

    if (appointmentsError) throw appointmentsError;

    // 4. Generar todos los posibles slots y marcar su estado
    const allSlots = [];
    const { open, close } = workingHours;
    let currentTime = new Date(`${date}T${open}`);
    const endTime = new Date(`${date}T${close}`);

    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      if (slotEnd > endTime) break; // El slot no cabe al final del día

      // Verificar si el slot se superpone con algún turno existente
      const isOverlapping = appointments.some((appt) => {
        const apptStart = new Date(`${date}T${appt.start_time}`);
        const apptEnd = new Date(`${date}T${appt.end_time}`);
        return slotStart < apptEnd && slotEnd > apptStart;
      });

      allSlots.push({
        time: slotStart.toTimeString().substring(0, 8), // Formato HH:mm:ss
        status: isOverlapping ? "booked" : "available",
      });

      currentTime.setMinutes(currentTime.getMinutes() + 15); // Avanzar en intervalos de 15 min para el siguiente posible inicio
    }

    res.status(200).json(allSlots);
  } catch (error) {
    res.status(500).json({
      message: "Error al calcular los horarios disponibles.",
      error: error.message,
    });
  }
};
