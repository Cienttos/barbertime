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
