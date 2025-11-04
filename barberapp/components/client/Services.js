import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

export default function Services({ services }) {
  const [showServices, setShowServices] = useState(false);

  const toggleServices = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowServices(!showServices);
  };

  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="list-outline" size={22} color="#0052cc" />
        <Text style={styles.sectionTitle}>Servicios</Text>
      </View>
      <BlurView intensity={50} tint="light" style={styles.servicesContainer}>
        <Pressable onPress={toggleServices} style={styles.serviceHeader}>
          <Text style={styles.serviceTitle}>Ver servicios disponibles</Text>
          <Ionicons
            name={showServices ? "chevron-up" : "chevron-down"}
            size={22}
            color="#e63946"
          />
        </Pressable>
        {showServices && (
          <View style={styles.serviceList}>
            {services?.map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#e63946"
                />
                <Text style={styles.serviceText}>{service.name}</Text>
                <Text style={styles.servicePrice}>${service.price}</Text>
              </View>
            ))}
          </View>
        )}
      </BlurView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 6,
  },
  servicesContainer: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#0052cc", // borde azul
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.3)", // sencillo
    marginBottom: 20,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1e293b",
  },
  serviceList: {
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  serviceText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#1e293b",
  },
  servicePrice: {
    fontWeight: "700",
    color: "#e63946", // detalles rojos
  },
});
