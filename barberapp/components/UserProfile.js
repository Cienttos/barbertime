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
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    } else {
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

      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
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
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    backgroundColor: "#fee2e2",
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
});
