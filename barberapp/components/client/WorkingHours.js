import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

const daysOfWeek = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function WorkingHours({ shopSettings }) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={22} color="#e63946" />
        <Text style={styles.sectionTitle}>Horarios</Text>
      </View>
      <View style={styles.daysGrid}>
        {Object.keys(daysOfWeek).map((dayKey, i) => {
          const info = shopSettings?.working_hours?.[dayKey];
          const enabled = info?.enabled;
          return (
            <BlurView
              key={i}
              intensity={60}
              tint="light"
              style={[
                styles.card,
                { borderLeftColor: "#e63946", borderRightColor: "#457b9d" },
              ]}
            >
              <Text style={styles.dayLabel}>{daysOfWeek[dayKey]}</Text>
              <Text style={styles.hourLabel}>
                {enabled ? `${info.open} - ${info.close}` : "Cerrado"}
              </Text>
            </BlurView>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 6,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 25,
  },
  card: {
    borderWidth: 2,
    margin: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 14,
    alignItems: "center",
    width: 105,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "transparent",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    overflow: "hidden",
  },
  dayLabel: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  hourLabel: { fontSize: 12, color: "#475569" },
});
