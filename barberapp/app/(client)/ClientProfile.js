import React from "react";
import { View, Text, StyleSheet } from "react-native";
import UserProfile from "../../components/UserProfile";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  // Simplemente renderiza el componente reutilizable
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="person-outline" size={28} color="#1e293b" />
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>
      </View>
      <UserProfile />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "white",
    borderBottomWidth: 3,
    borderBottomColor: "#e63946",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 10,
  },
});
