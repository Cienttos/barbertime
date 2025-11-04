import { supabaseAdmin } from "../../supabaseClient.js";

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res) => {
  console.log("⚙️ [BACKEND] Petición recibida en getServices.");
  try {
    const { data, error } = await supabaseAdmin.from("services").select("*");

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private/Admin
export const createService = async (req, res) => {
  const { name, duration_minutes, price } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .insert([{ name, duration_minutes, price }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, duration_minutes, price } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .update({ name, duration_minutes, price })
      .eq("id", id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
