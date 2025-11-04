import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import { useSessionStore } from "../store/sessionStore";
import { supabase } from "../config/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function UserProfile() {
  const { profile, setSession, setProfile } = useSessionStore();
  const router = useRouter();

  const handleLogout = async () => {
    console.log("➡️ [Logout] Iniciando proceso de cierre de sesión...");
    try {
      // 2. Llama a Supabase para invalidar la sesión en el cliente.
      // Esto elimina el token de AsyncStorage.
      const { error } = await supabase.auth.signOut();
      if (error) {
        setProfile(null);
        setSession(null);
        console.log("✅ [Logout] Estado local (Zustand) limpiado.");

        console.error("❌ [Logout] Error en supabase.auth.signOut():", error);
      } else {
        console.log(
          "✅ [Logout] Sesión de Supabase en cliente cerrada exitosamente."
        );
      }

      // 1. Limpia el estado local en Zustand PRIMERO.
      // Esto asegura que cualquier re-renderización ya no vea la sesión/perfil.
      setProfile(null);
      setSession(null);
      // 3. Redirige al usuario a la pantalla de login.
      router.replace("/(auth)/login");
      console.log("✅ [Logout] Redirección a /login completada.");
    } catch (e) {
      console.error("💥 [Logout] Error catastrófico durante el logout:", e);
      Alert.alert("Error", "Ocurrió un error al cerrar sesión.");
      // Intento de recuperación forzando la limpieza y redirección
      setSession(null);
      setProfile(null);
      router.replace("/(auth)/login");
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{
            uri:
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${
                profile.full_name || "User"
              }&background=random`,
          }}
          style={styles.avatar}
        />
        <Text style={styles.fullName}>{profile.full_name}</Text>
        <Text style={styles.role}>{profile.role}</Text>
      </View>

      <Pressable
        onPress={() => router.push("/(admin)/AdminCompleteProfile")} // Ruta unificada para editar
        style={styles.menuItem}
      >
        <Ionicons name="person-circle-outline" size={24} color="#4b5563" />
        <Text style={styles.menuItemText}>Editar Perfil</Text>
        <Ionicons name="chevron-forward-outline" size={24} color="#9ca3af" />
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="white" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#f9fafb",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 48,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#e63946",
  },
  fullName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1f2937",
  },
  role: {
    fontSize: 16,
    color: "#6b7280",
    textTransform: "capitalize",
    marginTop: 4,
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 18,
    color: "#374151",
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#e63946",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 32,
  },
  logoutText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
});
