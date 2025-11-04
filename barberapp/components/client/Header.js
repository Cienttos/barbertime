import React, { useRef, useEffect } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Header({ shopSettings }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={{ uri: shopSettings?.logo_url || "https://i.imgur.com/6b8QF0F.png" }}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      <LinearGradient
        colors={["#e63946", "#457b9d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.title}>{shopSettings?.name || "Barbería Clásica"}</Text>
      </LinearGradient>
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
        {shopSettings?.welcome_message || "Cortes clásicos con estilo moderno."}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#e63946",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    color: "#fff",
    paddingHorizontal: 10,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginVertical: 10,
    paddingHorizontal: 40,
  },
});
