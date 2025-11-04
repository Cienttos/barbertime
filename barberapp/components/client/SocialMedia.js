import React from "react";
import { View, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SocialMedia({ socialMedia }) {
  return (
    <View style={styles.socialContainer}>
      {socialMedia?.map((social) => (
        <Pressable
          key={social.id}
          onPress={() => Linking.openURL(social.url)}
          style={styles.wrapper}
        >
          {/* Borde con colores rojo, blanco, azul */}
          <LinearGradient
            colors={["#e63946", "#ffffff", "#0052cc", "#ffffff", "#e63946"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            {/* Fondo interior */}
            <View style={styles.innerCircle}>
              <Ionicons name="logo-instagram" size={26} color="#000" />
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  socialContainer: {
  flexDirection: "row",
  justifyContent: "center",
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
},

  wrapper: {
    marginHorizontal: 8,
  },
  gradientBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 4, // grosor del borde
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
