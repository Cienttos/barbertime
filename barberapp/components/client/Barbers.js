import React, { useRef, useEffect } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

export default function Barbers({ barbers }) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  // Animación del color del borde (rojo → blanco → azul → rojo)
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ["#e63946", "#ffffff", "#0052cc", "#e63946"],
  });

  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="cut-outline" size={22} color="#0052cc" />
        <Text style={styles.sectionTitle}>Barberos</Text>
      </View>
      <View style={styles.barbersContainer}>
        {barbers?.map((barber) => (
          <Animated.View key={barber.id} style={[styles.barberCard, { borderColor }]}>
            <BlurView intensity={50} tint="light" style={styles.innerBlur}>
              <Image
                source={{
                  uri:
                    barber.avatar_url ||
                    `https://ui-avatars.com/api/?background=e63946&color=fff&name=${barber.full_name}`,
                }}
                style={styles.barberAvatar}
              />
              <Text style={styles.barberName}>{barber.full_name}</Text>
            </BlurView>
          </Animated.View>
        ))}
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
  barbersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 25,
  },
  barberCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2,
    margin: 8,
    padding: 3,
    width: 140,
  },
  innerBlur: {
    flex: 1,
    alignItems: "center",
    borderRadius: 17,
    padding: 15,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  barberAvatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#0052cc", // detalle azul
    marginBottom: 8,
  },
  barberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "red",
    textAlign: "center",
  },
});
