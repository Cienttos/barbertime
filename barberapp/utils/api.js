import axios from "axios";
import { supabase } from "../config/supabase";

const API_URL = "http://192.168.0.69:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    // console.log("🔄 [Axios Interceptor] Obteniendo sesión actual de Supabase...");
    // Obtenemos la sesión más fresca directamente de la librería de Supabase.
    // Esta es la fuente de verdad más fiable para el estado de autenticación.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      // console.log("✅ [Axios Interceptor] Token encontrado. Añadiendo a cabeceras.");
      config.headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      // console.warn("⚠️ [Axios Interceptor] No se encontró token de sesión.");
      // Si no hay token, nos aseguramos de que no haya una cabecera de autorización antigua.
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    console.error("❌ [Axios Interceptor] Error en la configuración de la petición:", error);
    return Promise.reject(error);
  }
);

console.log(`[API] Cliente Axios configurado para conectar a: ${API_URL}`);

export default api;