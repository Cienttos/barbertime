import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSessionStore } from "../../store/sessionStore";
import api from "../../utils/api";
import { DateTime } from "luxon";

import Header from "../../components/client/Header"; // Esta ruta ya es correcta

const DashboardCard = ({ title, icon, screen, iconFamily = "Ionicons" }) => {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(screen)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {iconFamily === "MaterialCommunityIcons" ? (
        <MaterialCommunityIcons name={icon} size={28} color="#0052cc" />
      ) : (
        <Ionicons name={icon} size={28} color="#0052cc" />
      )}
      <Text style={styles.cardText}>{title}</Text>
    </Pressable>
  );
};

export default function BarberDashboard() {
  const { profile, session } = useSessionStore();
  const [shopData, setShopData] = useState({
    shopSettings: null,
    barbers: [],
    services: [],
  });
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [averageRating, setAverageRating] = useState("N/A");
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      setAppointmentsLoading(true);
      try {
        // Hacemos dos llamadas en paralelo para ser más eficientes
        const appointmentsRes = await api.get("/api/appointments/barber", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        console.log(
          "[BarberDashboard] Appointments API response data:",
          appointmentsRes.data
        ); // Added for debugging

        // Usar Luxon para un manejo de fechas y zonas horarias más robusto
        const now = DateTime.local();
        const todayString = now.toISODate();
        let todayCount = 0;
        let upcomingCount = 0;
        let completedCount = 0;
        let totalRating = 0;
        let ratedAppointments = 0;

        appointmentsRes.data.forEach((app) => {
          // Convertir la fecha del turno a un objeto DateTime para comparaciones robustas
          const appDate = DateTime.fromISO(app.appointment_date).startOf("day");

          // Contador para "Turnos para hoy"
          if (
            appDate.hasSame(now, "day") &&
            app.status !== "Cancelado" &&
            app.status !== "Completado"
          ) {
            todayCount++;
          }

          // Contador para "Próximos Turnos" (solo futuros, sin contar hoy)
          if (appDate > now.startOf("day") && app.status !== "Cancelado") {
            upcomingCount++;
          }

          if (app.status === "Completado") {
            completedCount++;
            if (app.notes?.rating) {
              totalRating += app.notes.rating;
              ratedAppointments++;
            }
          }
        });

        setTodayAppointments(todayCount);
        setUpcomingAppointments(upcomingCount);
        setCompletedAppointments(completedCount);
        setAverageRating(
          ratedAppointments > 0
            ? (totalRating / ratedAppointments).toFixed(1)
            : "N/A"
        );
      } catch (error) {
        // El error 404 probablemente se deba a que la ruta /appointments/barber no está protegida o no existe.
        console.error("Error fetching today's appointments:", error);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    const fetchShopData = async () => {
      try {
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
        console.error("Error fetching shop data for barber:", error);
        Alert.alert("Error", "Failed to load initial shop data.");
      }
    };

    fetchAppointments();
    fetchShopData();
  }, [session]);

  // Update loading state based on all data fetches
  useEffect(() => {
    if (!appointmentsLoading && shopData.shopSettings) {
      setLoading(false);
    }
  }, [appointmentsLoading, shopData]);

  return (
    <ScrollView style={styles.background} showsVerticalScrollIndicator={false}>
      {/* La información de la barbería va primero */}
      <Header shopSettings={shopData.shopSettings} />

      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Turnos para hoy</Text>
          {appointmentsLoading ? (
            <ActivityIndicator color="white" style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.summaryCount}>{todayAppointments}</Text>
          )}
        </View>

        {/* Accesos directos para el Barbero */}
        <View style={styles.cardsContainer}>
          <DashboardCard
            title="Turnos"
            icon="calendar-outline"
            screen="/(barber)/BarberAppointments"
          />
          <DashboardCard
            title="Horarios"
            icon="time-outline"
            screen="/(barber)/BarberAvailability"
          />
          <DashboardCard
            title="Días Libres"
            icon="calendar-remove-outline"
            screen="/(barber)/MySchedule"
            iconFamily="MaterialCommunityIcons"
          />
          <DashboardCard
            title="Servicios"
            icon="cut-outline"
            screen="/(tabs)/(barber)/services"
          />
        </View>

        {/* Estadísticas del Barbero */}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>Tus Estadísticas</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="hourglass-outline" size={32} color="#0052cc" />
            <Text style={styles.statValue}>{upcomingAppointments}</Text>
            <Text style={styles.statLabel}>Próximos Turnos</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-done-outline" size={32} color="#0052cc" />
            <Text style={styles.statValue}>{completedAppointments}</Text>
            <Text style={styles.statLabel}>Turnos completados</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="star-outline" size={32} color="#e63946" />
            <Text style={styles.statValue}>{averageRating}</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
        </View>

        <Pressable style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>Ver más estadísticas</Text>
          <Ionicons name="arrow-forward" size={16} color="#0052cc" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: "#f3f4f6", // Fondo claro, igual que el cliente
  },
  container: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: "#e63946", // Rojo
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryCount: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "white",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "46%", // Para que quepan 2 por fila con un margen
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    backgroundColor: "#f9fafb",
  },
  cardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    textAlign: "center",
  },
  divider: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db", // Divisor gris claro
    marginVertical: 24,
    alignItems: "center",
  },
  dividerText: {
    position: "absolute",
    top: -12,
    backgroundColor: "#f3f4f6", // Mismo color que el fondo
    paddingHorizontal: 8,
    color: "#6b7280",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statBox: {
    backgroundColor: "#f1f5f9", // Un blanco ligeramente grisáceo
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0052cc", // Azul
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#e63946", // Rojo
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#0052cc",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  outlineButtonText: {
    color: "#0052cc",
    fontWeight: "600",
  },
});
