import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Header from "../../components/client/Header";
import ReserveButton from "../../components/client/ReserveButton";
import WorkingHours from "../../components/client/WorkingHours";
import Barbers from "../../components/client/Barbers";
import Services from "../../components/client/Services";
import SocialMedia from "../../components/client/SocialMedia";
import api from "../../utils/api";
import { useCallback } from "react";

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
      <View style={styles.container}>
        <Header shopSettings={shopData.shopSettings} />
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
  background: { flex: 1, paddingTop: 50, backgroundColor: "#f3f4f6" },
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
