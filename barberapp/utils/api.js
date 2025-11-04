import axios from "axios";
import { useSessionStore } from "../store/sessionStore";

// =================================================================
// ⚠️ ¡ACCIÓN REQUERIDA! ⚠️
// Reemplaza 'TU_IP_LOCAL' con la dirección IP de tu computadora.
// Asegúrate de que tu teléfono/emulador y tu computadora
// estén en la misma red Wi-Fi.
// El puerto debe coincidir con el que usa tu backend (generalmente 3000).
// =================================================================
const API_URL = "http://192.168.0.69:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const session = useSessionStore.getState().session;
    if (session?.access_token) {
      config.headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

console.log(`[API] Cliente Axios configurado para conectar a: ${API_URL}`);

export default api;