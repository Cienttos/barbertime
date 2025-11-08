import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView, // Import SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "../../hooks/useSession";
import api from "../../utils/api";

const DashboardCard = ({ title, icon, screen, params = {} }) => {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: screen, params })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Ionicons name={icon} size={32} color="#0052cc" />
      <Text style={styles.cardTitle}>{title}</Text>
    </Pressable>
  );
};

export default function AdminDashboard() {
  const { profile, session } = useSession();
  const [stats, setStats] = useState({
    totalBarbers: 0,
    totalEarnings: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    upcomingAppointments: 0,
    averageRating: "N/A",
  });
  const [loading, setLoading] = useState(true);

  console.log("--- [AdminDashboard Render] ---");
  console.log(`[AdminDashboard] Has profile: ${!!profile}`);
  console.log(`[AdminDashboard] Has session: ${!!session}`);
  console.log(`[AdminDashboard] Loading state: ${loading}`);

  // Redirección si el usuario no es admin
  const router = useRouter();
  useEffect(() => {
    if (profile && profile.role !== "admin") {
      Alert.alert(
        "Acceso Denegado",
        "No tienes permiso para ver esta sección."
      );
      router.replace("/(barber)/BarberDashboard"); // O a la ruta que corresponda
    }
  }, [profile]);

  useEffect(() => {
    const fetchStats = async () => {
      console.log("[AdminDashboard useEffect] fetchStats triggered.");
      if (!session?.access_token) return;
      setLoading(true);
      try {
        console.log("[AdminDashboard] 🚀 Fetching admin stats...");
        const [usersRes, appointmentsRes] = await Promise.all([
          api.get("/api/admin/users", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          api.get("/api/admin/appointments", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);
        console.log("[AdminDashboard] ✅ Stats fetched successfully.");

        const barbers = usersRes.data.filter((u) => u.role === "barber");

        let earnings = 0;
        let completed = 0;
        let cancelled = 0;
        let upcoming = 0;
        let totalRating = 0;
        let ratedAppointments = 0;

        appointmentsRes.data.forEach((app) => {
          if (app.status === "Completado") {
            completed++;
            earnings += app.services?.price || 0;
            if (app.notes?.rating) {
              totalRating += app.notes.rating;
              ratedAppointments++;
            }
          } else if (app.status === "Cancelado") {
            cancelled++;
          } else if (
            app.status === "Reservado" ||
            app.status === "En Proceso"
          ) {
            upcoming++;
          }
        });

        setStats({
          totalBarbers: barbers.length,
          totalEarnings: earnings,
          completedAppointments: completed,
          cancelledAppointments: cancelled,
          upcomingAppointments: upcoming,
          averageRating:
            ratedAppointments > 0
              ? (totalRating / ratedAppointments).toFixed(1)
              : "N/A",
        });
      } catch (error) {
        console.error(
          "[AdminDashboard] ❌ Error fetching admin stats:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.panelTitle}>Admin Panel</Text>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#ffffff" // Blanco para el escudo
            />
          </View>
          <Text style={styles.welcomeTitle}>Bienvenido de nuevo,</Text>
          <Text style={styles.welcomeName}>
            {profile?.full_name || "Admin"}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0052cc" />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon="people"
                label="Barberos"
                value={stats.totalBarbers}
                color="#0052cc" // Blue
              />
              <StatCard
                icon="cash"
                label="Ganancias"
                value={`$${stats.totalEarnings.toFixed(2)}`}
                color="#16a34a" // Mantengo verde para dinero
              />
              <StatCard
                icon="hourglass"
                label="Turnos Próximos"
                value={stats.upcomingAppointments}
                color="#0052cc" // Blue
              />
              <StatCard
                icon="checkmark-done"
                label="Turnos Completados"
                value={stats.completedAppointments} // Blue
                color="#0052cc"
              />
              <StatCard
                icon="close-circle"
                label="Turnos Cancelados"
                value={stats.cancelledAppointments}
                color="#e63946" // Red
              />
              <StatCard
                icon="star"
                label="Calificación Prom."
                value={stats.averageRating}
                color="#e63946" // Red
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.actionsGrid}>
              <DashboardCard
                title="Gestionar Barbería"
                icon="business-outline"
                screen="/(admin)/AdminBarbershop"
              />
              <DashboardCard
                title="Gestionar Usuarios"
                icon="people-outline"
                screen="/(admin)/AdminUsers"
              />
              <DashboardCard
                title="Gestionar Servicios"
                icon="cut-outline"
                screen="/(admin)/AdminServices"
              />
              <DashboardCard
                title="Gestionar Turnos"
                icon="calendar-outline"
                screen="/(admin)/AdminAppointments"
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardContent}>
        <Ionicons name={icon} size={28} color={color} />
        <Text style={[styles.statValue, { color: color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.footerStripe, { backgroundColor: "#e63946" }]} />
        <View style={[styles.footerStripe, { backgroundColor: "#ffffff" }]} />
        <View style={[styles.footerStripe, { backgroundColor: "#0052cc" }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingTop: 48, // Aumentado para bajar más el contenido
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  headerTopRow: {
    flexDirection: "row",
    alignSelf: "center", // Centra el chip en el contenedor
    alignItems: "center",
    backgroundColor: "#0052cc", // Fondo azul
    borderRadius: 999, // Bordes completamente redondeados (píldora)
    paddingVertical: 6, // Reducido para achicar el chip
    paddingHorizontal: 14,
    marginBottom: 24,
    gap: 8,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff", // Texto blanco
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    color: "#4b5563",
  },
  welcomeName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e63946", // Color rojo para el nombre
    marginTop: -4, // Ajuste para que se vea más integrado
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -8, // Compensate for card margin
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "30%", // Three cards per row
    marginBottom: 16,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden", // Para que el footer no se salga del borde redondeado
    flexDirection: "column", // Asegura que los hijos se apilen verticalmente
    justifyContent: "space-between", // Empuja el footer hacia abajo
  },
  statCardContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flex: 1, // Permite que este contenedor crezca y ocupe el espacio disponible
  },
  cardFooter: {
    height: 6, // Altura total de 6px
    width: "100%",
    flexDirection: "column", // Para apilar las franjas verticalmente
  },
  footerStripe: {
    flex: 1, // Cada franja toma 1/3 de la altura (2px cada una)
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  divider: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    marginVertical: 32,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginHorizontal: -8, // Compensate for card margin
  },
  card: {
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    width: "48%", // Two cards per row
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardPressed: {
    backgroundColor: "#f1f5f9",
    transform: [{ scale: 0.98 }],
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e63946", // Texto rojo como solicitado
    marginTop: 8,
    textAlign: "center",
  },
});
