import { useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";
import { supabase } from "../config/supabase";
import api from "../utils/api";

export const useSession = () => {
  const {
    session,
    profile,
    setSession,
    setProfile,
    isLoading,
    setLoading,
    isInitialized,
    setInitialized,
  } = useSessionStore();

  useEffect(() => {
    // 1. Set up the auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 [useSession] Auth event: ${event}`);
        setSession(session);
        if (session?.access_token) {
          console.log(`🔑 [useSession] New access token: ${session.access_token.substring(0, 10)}...`);
        } else {
          console.log(`🔑 [useSession] No access token in session.`);
        }

        // If the user signs out, clear the profile
        if (event === "SIGNED_OUT") {
          setProfile(null);
        }

        // Mark as initialized after the first auth event
        if (!isInitialized) {
          setInitialized(true);
        }
      }
    );

    // 2. Set up the API interceptor
    const interceptor = api.interceptors.request.use(
      (config) => {
        // Get the latest session state directly from the store
        const currentSession = useSessionStore.getState().session;
        if (currentSession?.access_token) {
          config.headers[
            "Authorization"
          ] = `Bearer ${currentSession.access_token}`;
          console.log("✅ [API Interceptor] Token attached.");
        } else {
          console.warn("⚠️ [API Interceptor] No session token found.");
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      // Cleanup listeners and interceptors on unmount
      console.log(
        "🧹 [useSession] Cleaning up auth listener and API interceptor."
      );
      authListener.subscription.unsubscribe();
      api.interceptors.request.eject(interceptor);
    };
  }, []); // Run this effect only once to set up listeners.

  useEffect(() => {
    // 3. Fetch profile ONLY when the session is first set
    const fetchProfile = async () => {
      // Only fetch if we have a session but no profile, and we are not already loading
      if (session && !profile && !isLoading) {
        setLoading(true);
        console.log("🚀 [useSession] Session detected, fetching profile...");
        try {
          const { data, error } = await api.get("/api/profile");
          if (error) throw error;
          // ✅ Comprobación de seguridad MEJORADA para evitar el crash
          if (data && data.profile) {
            console.log("✅ [useSession] Profile fetched:", data.profile.role);
            setProfile(data.profile);
          } else {
            console.warn(
              "⚠️ [useSession] La API devolvió datos pero sin perfil. Estableciendo perfil vacío."
            );
            setProfile({}); // Evita que 'profile' sea undefined
          }
        } catch (error) {
          console.error("❌ [useSession] Error fetching profile:", error);
          // If profile fetch fails, it might be a new user.
          // We set profile to an empty object to signify we tried.
          setProfile({});
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [session, profile, isLoading]); // Dependencies to control profile fetching

  return useSessionStore();
};
