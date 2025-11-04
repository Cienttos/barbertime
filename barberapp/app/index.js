import React, { useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";
import { useRouter, useSegments } from "expo-router";
import LoadingScreen from "../components/LoadingScreen";
import { View } from "react-native";

export default function StartPage() {
  const { session, profile, isInitialized } = useSessionStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log("--- [StartPage useEffect] ---");
    console.log(`[StartPage] isInitialized: ${isInitialized}`);
    console.log(`[StartPage] Has session: ${!!session}`);
    console.log(`[StartPage] Has profile: ${!!profile}`);
    if (profile) {
      console.log(`[StartPage] Profile role: ${profile.role}`);
      console.log(`[StartPage] Profile name: ${profile.full_name}`);
    }
    console.log(`[StartPage] Segments: ${JSON.stringify(segments)}`);

    // Espera a que el store de Zustand se haya rehidratado (cargado)
    if (!isInitialized) {
      console.log("[StartPage] ⏳ Store not initialized yet. Aborting effect.");
      return;
    }

    const inProtectedRouteGroup =
      segments[0] && ["(admin)", "(barber)", "(client)"].includes(segments[0]);
    const inAuthGroup = segments[0] === "(auth)";

    // 1. Si el usuario no tiene sesión y no está en una pantalla de autenticación,
    //    lo enviamos a la pantalla de login.
    if (!session && !inAuthGroup) {
      console.log("[StartPage] ➡️ No session, redirecting to /login.");
      router.replace("/(auth)/login");
      return;
    }

    // 2. Si el usuario tiene sesión, pero no está en una ruta protegida,
    //    y además ya tenemos el perfil, lo redirigimos al lugar correcto.
    //    La clave es el `&& profile` para evitar condiciones de carrera.
    if (session && profile && !inProtectedRouteGroup) {
      // 2a. Si el perfil no está completo, lo mandamos a completarlo.
      if (!profile?.full_name) {
        console.log(
          "[StartPage] ➡️ Profile incomplete. Redirecting to /AdminCompleteProfile."
        );
        router.replace("/(admin)/AdminCompleteProfile");
        return;
      }

      // 2b. Si el perfil está completo, lo mandamos a su dashboard.
      if (profile.role) {
        console.log(
          `[StartPage] ✅ Profile complete. Role: ${profile.role}. Redirecting to dashboard.`
        );
        if (profile.role === "admin") {
          router.replace("/(admin)/AdminDashboard");
        } else if (profile.role === "barber") {
          router.replace("/(barber)/BarberDashboard");
        } else {
          // 'user' o cualquier otro por defecto
          router.replace("/(client)/ClientDashboard");
        }
        return;
      }
    }
  }, [session, profile, segments, isInitialized, router]);

  // Muestra una pantalla de carga mientras se inicializa o redirige.
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* Este View se muestra brevemente durante la redirección */}
    </View>
  );
}
