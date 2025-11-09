import React, { useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import LoadingScreen from "../components/LoadingScreen";

export default function StartPage() {
  const rootNavigationState = useRootNavigationState();
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

    // Espera a que el store de Zustand se haya rehidratado y que el router esté listo.
    // Esto previene errores de "navegación antes de que el layout esté montado".
    if (!isInitialized || !rootNavigationState?.key) {
      console.log(
        `[StartPage] ⏳ Waiting for initialization. Store: ${isInitialized}, Router: ${!!rootNavigationState?.key}`
      );
      return;
    }

    const currentGroup = segments[0];
    const inProtectedRouteGroup =
      currentGroup && ["(admin)", "(barber)", "(client)"].includes(currentGroup);
    const inAuthGroup = segments[0] === "(auth)";

    // 1. Si el usuario no tiene sesión y no está en una pantalla de autenticación,
    //    lo enviamos a la pantalla de login. Esto solo se ejecuta si no estamos ya en (auth).
    if (!session && !inAuthGroup) {
      console.log("[StartPage] ➡️ No session, redirecting to /login.");
      router.replace("/(auth)/login");
      return;
    }

    // 2. Si el usuario tiene sesión y perfil, aplicamos la lógica de redirección estricta.
    if (session && profile) {
      const targetDashboard =
        profile.role === "admin" || profile.role === "barber"
          ? "/(admin)/AdminDashboard"
          : "/(client)/ClientDashboard";
      const targetGroup = targetDashboard.split("/")[1];

      // Si el usuario está en un grupo protegido pero no es el que le corresponde a su rol,
      // lo redirigimos forzosamente a su dashboard correcto.
      // ESTA ES LA CORRECCIÓN CLAVE.
      if (inProtectedRouteGroup && currentGroup !== targetGroup) {
        console.log(
          `[StartPage] ⚠️ Role/route mismatch! Role: ${profile.role}, Route: ${currentGroup}. Redirecting to ${targetDashboard}.`
        );
        router.replace(targetDashboard);
        return;
      }

      // Si el usuario ya está en su grupo correcto o en la autenticación, no hacemos nada para evitar bucles.
      if (currentGroup === targetGroup || inAuthGroup) return;

      // 2a. Si el perfil no está completo, lo mandamos a la pantalla correspondiente.
      if (!profile?.full_name) {
        const path =
          profile.role === "admin"
            ? "/(admin)/AdminCompleteProfile"
            : "/(client)/ClientCompleteProfile";
        console.log(
          `[StartPage] ➡️ Profile incomplete. Redirecting to ${path}`
        );
        router.replace(path);
        return;
      }

      // 2b. Si el perfil está completo y no está en ninguna ruta protegida, lo mandamos a su dashboard.
      console.log(
        `[StartPage] ✅ Profile complete. Role: ${profile.role}. Redirecting to dashboard.`
      );
      router.replace(targetDashboard);
    }
  }, [session, profile, isInitialized, rootNavigationState]);

  // Muestra una pantalla de carga mientras se inicializa o redirige.
  // Siempre mostramos una pantalla de carga para darle tiempo al useEffect de redirigir,
  // evitando que se renderice brevemente una pantalla incorrecta.
  return <LoadingScreen />;
}
