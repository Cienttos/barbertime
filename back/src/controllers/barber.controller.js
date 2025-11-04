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

// @desc    Get appointments for the authenticated barber
// @route   GET /api/barber/appointments
// @access  Private/Barber
export const getMyBarberAppointments = async (req, res) => {
  const barberId = req.user.id;
  try {
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
