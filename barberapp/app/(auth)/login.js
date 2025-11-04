import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../../config/supabase"; // ADAPTADO
import { useSessionStore } from "../../store/sessionStore"; // ADAPTADO
import api from "../../utils/api"; // Importamos la instancia de Axios
const BACKEND_URL = "http://192.168.0.69:3000";

export default function Login() {
  const router = useRouter();
  const { setSession, setProfile } = useSessionStore(); // 👈 AHORA TAMBIÉN USAMOS setProfile
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleDeepLink = async (event) => {
      console.log("🔗 [Login] Deep link capturado:", event.url);
      const url = event.url;
      const hash = url.split("#")[1];
      if (!hash) {
        console.log("⚠️ [Login] No hash en la URL del deep link.");
        return;
      }

      const params = Object.fromEntries(new URLSearchParams(hash));
      const access_token = params["access_token"];
      const refresh_token = params["refresh_token"];

      if (access_token) {
        setLoading(true);
        console.log("🔄 [Login] Estableciendo sesión con access_token.");
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          console.error("❌ [Login] Error al establecer sesión:", error);
          Alert.alert("Error", error.message);
          setLoading(false);
          return;
        }

        // Sincronizar perfil con el backend después de un login de Google
        try {
          const syncResponse = await api.post(
            "/api/auth/sync", // La ruta correcta es /api/auth/sync
            {},
            {
              headers: { Authorization: `Bearer ${access_token}` },
            }
          );

          // Axios usa `status` en lugar de `ok`. Un 200 o 201 es éxito.
          if (syncResponse.status === 200 || syncResponse.status === 201) {
            const { profile } = syncResponse.data;
            console.log("✅ [Login] Perfil de Google sincronizado:", profile);

            // Es crucial establecer el perfil ANTES que la sesión para evitar
            // condiciones de carrera en la navegación.
            setProfile(profile);
            setSession(data.session);
            console.log("✅ [Login] Sesión de Google establecida.");

            // Redirigir al dashboard correspondiente según el rol del perfil
            const role = profile?.role;
            const targetDashboard =
              role === "admin"
                ? "/(admin)/AdminDashboard"
                : role === "barber"
                ? "/(barber)/BarberDashboard"
                : "/(client)/ClientDashboard";
            router.replace(targetDashboard);
          } else {
            // Si el backend responde con un error, lo mostramos.
            throw new Error(
              syncResponse.data.message || "Error del servidor al sincronizar"
            );
          }
        } catch (syncError) {
          console.error(
            "💥 [Login] Error de red al sincronizar el perfil:",
            syncError.response?.data || syncError.message
          );
          // Es crucial limpiar la sesión si la sincronización falla para evitar inconsistencias.
          await supabase.auth.signOut();
          Alert.alert(
            "Error de Sincronización",
            "No se pudo obtener tu perfil del servidor. Por favor, intenta de nuevo."
          );
          setLoading(false);
          return; // Detenemos la ejecución aquí
        }

        setLoading(false);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleDeepLink({ url: initialUrl });
    })();

    return () => subscription.remove();
  }, [setSession, setProfile]);

  const handleGoogle = async () => {
    setLoading(true);
    console.log("🚀 [Login] Iniciando Google OAuth (flujo en cliente).");
    try {
      const redirectTo = Linking.createURL("/"); // Redirige de vuelta a la app

      console.log("🚀 [Login] Google OAuth redirectTo:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true, // Importante para que devuelva la URL
        },
      });

      if (error) {
        console.error("❌ [Login] Error en signInWithOAuth:", error);
        Alert.alert("Error", error.message);
      }

      if (data?.url) {
        console.log("📲 [Login] Abriendo URL de OAuth de Supabase:", data.url);
        await Linking.openURL(data.url);
      }
    } catch (error) {
      console.error("💥 [Login] Catch en handleGoogle:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    console.log("📧 [Login] Iniciando sesión con Email vía Backend.");
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (response.ok && result.session) {
        // El backend nos devuelve la sesión Y el perfil.
        const { error } = await supabase.auth.setSession(result.session);
        if (error) throw error;

        // ✅ GUARDAMOS AMBOS EN EL STORE (PERFIL PRIMERO)
        // Es crucial establecer el perfil ANTES que la sesión para evitar
        // condiciones de carrera en la navegación.
        setProfile(result.profile);
        setSession(result.session);

        console.log(
          `✅ [Login] Sesión y Perfil establecidos desde backend. Rol: ${
            result.profile?.role || "no definido"
          }`
        );
        // La navegación se maneja aquí para asegurar la redirección inmediata
        // después de un login exitoso desde esta pantalla.
        const role = result.profile?.role;
        if (role === "admin") {
          router.replace("/(admin)/AdminDashboard");
        } else if (role === "barber") {
          router.replace("/(barber)/BarberDashboard");
        } else {
          router.replace("/(client)/ClientDashboard");
        }
      } else {
        Alert.alert("Error", result.error || "Error al iniciar sesión.");
      }
    } catch (error) {
      console.error("💥 [Login] Error de red al iniciar sesión:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 px-6">
      <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <Text className="mb-6 text-center text-3xl font-bold text-gray-800">
          Iniciar sesión
        </Text>

        <TextInput
          className="mb-4 w-full rounded-xl border border-gray-300 p-3 text-base"
          placeholder="usuario@ejemplo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View className="relative mb-4 w-full">
          <TextInput
            className="w-full rounded-xl border border-gray-300 p-3 text-base pr-10"
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5"
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="gray"
            />
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="mb-3 w-full items-center justify-center rounded-xl bg-blue-600 py-3 active:bg-blue-700"
        >
          <Text className="text-base font-semibold text-white">
            {loading ? "Cargando..." : "Iniciar sesión"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          className="mb-6 w-full items-center justify-center py-2"
        >
          <Text className="text-center text-blue-600">
            ¿No tienes cuenta? Regístrate aquí.
          </Text>
        </Pressable>

        <View className="my-6 flex-row items-center">
          <View className="h-[1px] flex-1 bg-gray-300" />
          <Text className="mx-4 text-gray-500">O</Text>
          <View className="h-[1px] flex-1 bg-gray-300" />
        </View>

        <Pressable
          onPress={handleGoogle}
          disabled={loading}
          className="flex-row items-center justify-center rounded-xl border border-gray-300 py-3 active:bg-gray-50"
        >
          <AntDesign name="google" size={20} color="#DB4437" />
          <Text className="ml-3 text-base font-semibold text-gray-700">
            {loading ? "Cargando..." : "Continuar con Google"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
