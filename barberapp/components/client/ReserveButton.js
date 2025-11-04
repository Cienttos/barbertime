import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ReserveButton() {
  const router = useRouter();
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleReserve = () => {
    router.push("/book-appointment");
  };

  const translateX = moveAnim.interpolate({
    // Animar el ancho de un ciclo de color completo (4 franjas * 20px) para un bucle perfecto.
    inputRange: [0, 0.5, 1],
    outputRange: [0, -40, -80],
  });

  return (
    <Pressable
      onPress={handleReserve}
      style={({ pressed }) => [
        styles.reserveButton,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.outerBorder}>
        <View style={styles.barberPoleWrapper}>
          {/* Fondo animado */}
          <Animated.View
            style={[
              styles.stripeContainer,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            {Array.from({ length: 80 }).map((_, i) => {
              // Secuencia: rojo, blanco, azul, blanco
              const colorIndex = i % 4;
              const color =
                colorIndex === 0
                  ? "#e63946" // rojo
                  : colorIndex === 1
                  ? "#ffffff" // blanco
                  : colorIndex === 2
                  ? "#0052cc" // azul
                  : "#ffffff"; // blanco extra entre azul y rojo
              return (
                <View
                  key={i}
                  style={[styles.stripe, { backgroundColor: color }]}
                />
              );
            })}
          </Animated.View>

          {/* Contenido */}
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Reservar Turno</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  reserveButton: {
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 50,
    overflow: "hidden",
    alignSelf: "center",
  },
  outerBorder: {
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 50,
    padding: 2,
  },
  barberPoleWrapper: {
    width: 260,
    height: 60,
    borderRadius: 50,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  stripeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    flexDirection: "row",
    width: "400%",
    height: "100%",
  },
  stripe: {
    width: 20,
    height: "300%", // Aumentamos la altura para asegurar que cubra todo el espacio al inclinarse
    top: "-100%", // Centramos la franja verticalmente
    transform: [{ skewX: "-45deg" }], // Inclinación de 45 grados
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 26,
    textShadowColor: "black",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
