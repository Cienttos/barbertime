import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import Header from "../../components/client/Header";
import ReserveButton from "../../components/client/ReserveButton";
import WorkingHours from "../../components/client/WorkingHours";
import Barbers from "../../components/client/Barbers";
import Services from "../../components/client/Services";
import SocialMedia from "../../components/client/SocialMedia";
import api from "../../utils/api";
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

export default function ClientDashboard() {
  const [shopData, setShopData] = useState({
    shopSettings: null,
    barbers: [],
    services: [],
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchShopData = async () => {
        setLoading(true);
        try {
          // Hacemos las llamadas a los endpoints públicos en paralelo
          const [settingsRes, barbersRes, servicesRes] = await Promise.all([
            api.get("/api/public/shop-info"),
            api.get("/api/public/barbers"),
            api.get("/api/public/services"),
          ]);
          setShopData({
            shopSettings: settingsRes.data,
            barbers: barbersRes.data,
            services: servicesRes.data,
          });
        } catch (error) {
          console.error("Error fetching shop data for client:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchShopData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.background} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inicio</Text>
        {/* Puedes agregar un ícono aquí si lo deseas */}
      </View>
      <View style={styles.container}>
        {/* El componente Header original se puede reutilizar para el contenido si es necesario,
            o puedes integrar su lógica directamente aquí. Por ahora, lo comento. */}
        {/* <Header shopSettings={shopData.shopSettings} /> */}
        <ReserveButton />
        <WorkingHours shopSettings={shopData.shopSettings} />
        <Barbers barbers={shopData.barbers} />
        <Services services={shopData.services} />
        <SocialMedia socialMedia={shopData.shopSettings?.social_media} />
      </View>
    </ScrollView>
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
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },
  background: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { alignItems: "center", paddingBottom: 50 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4b5563",
  },
});
