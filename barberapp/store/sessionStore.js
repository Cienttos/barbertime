import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";

export const useSessionStore = create(
  persist(
    (set, get) => ({
      session: null,
      profile: null,
      isInitialized: false, // Inicia en false. Esto es clave.
      isLoading: true,

      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoginData: (session, profile) => set({ session, profile }),
    }),
    {
      name: "session-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Esta función se ejecuta una sola vez cuando el store termina de cargar los datos guardados.
      onRehydrateStorage: () => (state) => {
        console.log("🔄 [Store] Rehidratación completada.");
        state.isInitialized = true; // ¡Aquí está la magia! Marcamos como inicializado.
        state.isLoading = false;
      },
      // Este listener se activa después de la rehidratación para mantener la sesión sincronizada.
      onRehydrate: () => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log("🔄 [Store] onAuthStateChange event:", event);
            if (event === "SIGNED_IN") {
              set({ session: session });
            } else if (event === "SIGNED_OUT") {
              set({ session: null, profile: null });
            } else if (event === "TOKEN_REFRESHED") {
              set({ session: session });
            }
          }
        );

        return () => {
          authListener.subscription.unsubscribe();
        };
      },
    }
  )
);
