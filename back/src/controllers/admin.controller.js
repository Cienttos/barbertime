import { supabaseAdmin } from "../../supabaseClient.js";
import { DateTime } from "luxon"; // DateTime is used in cleanupPastAppointments

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

// Un UUID fijo y válido para la única fila de configuración general.
const GENERAL_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // Se obtienen los perfiles directamente, que ya contienen toda la información necesaria.
    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (error) throw error;

    // Si necesitas el email de la tabla auth.users, se podría hacer un join,
    // pero para la UI actual, la tabla profiles es suficiente y más simple.
    // Si el email no está en profiles, se puede añadir o hacer una consulta más compleja.
    // Por ahora, esto soluciona el problema de las imágenes y roles.
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single user with detailed stats
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserDetails = async (req, res) => {
  const { id } = req.params;
  console.log(`[getUserDetails] 🌀 Request received for user ID: ${id}`);

  try {
    // 1. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError)
      throw new Error(`Profile fetch error: ${profileError.message}`);
    if (!profile) return res.status(404).json({ message: "User not found" });

    // Get user data from auth.users to retrieve the email
    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(id);
    if (authUserError) {
      console.warn(
        `[getUserDetails] Could not fetch auth user for ID ${id}: ${authUserError.message}`
      );
    }
    profile.email = authUser?.user?.email || profile.email; // Add email from auth.users to the profile object
    console.log(`[getUserDetails] ✅ Profile found for: ${profile.full_name}`);

    // 2. Get all appointments for this user
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("*, services(*), barber:barber_id(id, full_name, avatar_url)")
      .eq("client_id", id)
      .order("appointment_date", { ascending: false });

    console.log(
      `[getUserDetails] Appointments found: ${appointments?.length || 0}`
    );

    if (appointmentsError) throw appointmentsError;

    // 3. Calculate stats
    const completedAppointments = appointments.filter(
      (a) => a.status === "Completado"
    );
    const cancelledAppointments = appointments.filter(
      (a) => a.status === "Cancelado"
    );
    const upcomingAppointments = appointments.filter(
      (a) => a.status === "Reservado" || a.status === "En Proceso"
    );

    const totalSpent = completedAppointments.reduce(
      (sum, a) => sum + (a.price || a.services?.price || 0),
      0
    );

    // Calculate favorite barber
    const barberCounts = completedAppointments.reduce((acc, app) => {
      if (app.barber) {
        acc[app.barber.id] = (acc[app.barber.id] || 0) + 1;
      }
      return acc;
    }, {});

    let favoriteBarber = null;
    if (Object.keys(barberCounts).length > 0) {
      const favoriteBarberId = Object.keys(barberCounts).reduce((a, b) =>
        barberCounts[a] > barberCounts[b] ? a : b
      );
      const favBarberInfo = completedAppointments.find(
        (a) => a.barber?.id === favoriteBarberId
      )?.barber;
      if (favBarberInfo) {
        favoriteBarber = {
          name: favBarberInfo.full_name,
          avatar: favBarberInfo.avatar_url,
        };
      }
    } else {
      favoriteBarber = null; // Ensure it's null if no completed appointments
    }

    console.log("[getUserDetails] 📊 Calculated Stats:", {
      completed: completedAppointments.length,
      cancelled: cancelledAppointments.length,
      upcoming: upcomingAppointments.length,
      totalSpent,
      favoriteBarber,
    });
    // 4. Combine and send response
    res.status(200).json({
      profile,
      appointments,
      stats: {
        completed: completedAppointments.length,
        cancelled: cancelledAppointments.length,
        upcoming: upcomingAppointments.length,
        totalSpent,
        favoriteBarber,
      },
    });
  } catch (error) {
    console.error(`[getUserDetails] ❌ Final catch block error:`, error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    // First, update the role in the profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select();

    if (profileError) throw profileError;

    if (profileData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Second, update the user's app_metadata in auth.users to reflect the new role in JWT
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.updateUserById(id, {
        app_metadata: { role: role },
      });

    if (userError) throw userError;

    res.status(200).json({
      message: "User role updated successfully",
      user: profileData[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private/Admin
export const getAllAppointments = async (req, res) => {
  try {
    // Perform cleanup before fetching data
    await cleanupPastAppointments();

    const { data, error } = await supabaseAdmin.from("appointments").select(`
        *, 
        services(*), 
        client:client_id (id, full_name, avatar_url), 
        barber:barber_id (id, full_name, avatar_url)
      `);

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all barber availability
// @route   GET /api/admin/barber-availability
// @access  Private/Admin
export const getAllBarberAvailability = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, extra_data")
      .eq("role", "barber");

    if (error) throw error;

    const availabilityData = data.map((barber) => ({
      barber_id: barber.id,
      full_name: barber.full_name,
      availability: barber.extra_data.availability,
    }));

    res.status(200).json(availabilityData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get general shop data
// @route   GET /api/admin/general
// @access  Private/Admin
export const getGeneralData = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("general")
      .select("data")
      .eq("id", GENERAL_SETTINGS_ID)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: "The result contains 0 rows" - no es un error si no hay datos.
      throw error;
    }

    res.status(200).json(data?.data || {}); // Devuelve el objeto de datos directamente o un objeto vacío
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update general shop data
// @route   PUT /api/admin/general
// @access  Private/Admin
export const updateGeneralData = async (req, res) => {
  const settings = req.body;

  try {
    // Check if a record exists, if not, create one (upsert behavior)
    const { data, error } = await supabaseAdmin
      .from("general")
      .upsert({ id: GENERAL_SETTINGS_ID, data: settings }, { onConflict: "id" })
      .select();

    if (error) throw error;

    res.status(200).json(data[0]); // Devuelve el objeto actualizado directamente
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
