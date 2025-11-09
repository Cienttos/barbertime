import { supabaseAdmin } from "../../supabaseClient.js";

// @desc    Get user statistics
// @route   GET /api/stats/user
// @access  Private
export const getUserStats = async (req, res) => {
  const targetUserId = req.params.userId || req.user.id;

  try {
    // Get all appointments for the user
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("status, barber_id")
      .eq("client_id", targetUserId);

    if (appointmentsError) throw appointmentsError;

    // Calculate stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === "Completado"
    ).length;
    const canceledAppointments = appointments.filter(
      (a) => a.status === "Cancelado"
    ).length;

    // Find most used barber
    const barberCounts = appointments.reduce((acc, appointment) => {
      if (appointment.barber_id) {
        acc[appointment.barber_id] = (acc[appointment.barber_id] || 0) + 1;
      }
      return acc;
    }, {});

    let mostUsedBarber = null;
    if (Object.keys(barberCounts).length > 0) {
      const mostUsedBarberId = Object.keys(barberCounts).reduce((a, b) =>
        barberCounts[a] > barberCounts[b] ? a : b
      );

      const { data: barberProfile, error: barberError } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", mostUsedBarberId)
        .single();

      if (barberError) {
        console.error("Error fetching most used barber:", barberError.message);
      } else {
        mostUsedBarber = {
          name: barberProfile.full_name,
          appointments: barberCounts[mostUsedBarberId],
        };
      }
    }

    res.status(200).json({
      totalAppointments,
      completedAppointments,
      canceledAppointments,
      mostUsedBarber,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  console.log("🔥 getAdminStats function hit!");
  try {
    // Run all count queries in parallel for better performance
    const [
      { count: totalUsers, error: usersError },
      { count: totalBarbers, error: barbersError },
      { count: totalAppointments, error: appointmentsError },
      { count: totalServices, error: servicesError },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "barber"),
      supabaseAdmin
        .from("appointments")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("services")
        .select("id", { count: "exact", head: true }),
    ]);

    // Check for any errors from the parallel queries
    if (usersError) throw usersError;
    if (barbersError) throw barbersError;
    if (appointmentsError) throw appointmentsError;
    if (servicesError) throw servicesError;

    res.status(200).json({
      totalUsers: totalUsers ?? 0,
      totalBarbers: totalBarbers ?? 0,
      totalAppointments: totalAppointments ?? 0,
      totalServices: totalServices ?? 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error.message);
    res.status(500).json({ message: error.message });
  }
};
