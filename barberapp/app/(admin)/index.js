import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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
  const { session } = useSession();
  const [stats, setStats] = useState({
    totalBarbers: 0,
    totalEarnings: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    upcomingAppointments: 0,
    averageRating: "N/A",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.token) return;
      setLoading(true);
      try {
        const [usersRes, appointmentsRes] = await Promise.all([
          api.get("/api/admin/users", {
            headers: { Authorization: `Bearer ${session.token}` },
          }),
          api.get("/api/admin/appointments", {
            headers: { Authorization: `Bearer ${session.token}` },
          }),
        ]);

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
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          ¡Hola, {session?.user?.full_name || "Admin"}!
        </Text>
        <Text style={styles.subtitle}>
          Bienvenido al panel de administración.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0052cc" />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            label="Barberos"
            value={stats.totalBarbers}
            color="#2563eb"
          />
          <StatCard
            icon="cash"
            label="Ganancias"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            color="#16a34a"
          />
          <StatCard
            icon="hourglass"
            label="Turnos Próximos"
            value={stats.upcomingAppointments}
            color="#f59e0b"
          />
          <StatCard
            icon="checkmark-done"
            label="Turnos Completados"
            value={stats.completedAppointments}
            color="#9333ea"
          />
          <StatCard
            icon="close-circle"
            label="Turnos Cancelados"
            value={stats.cancelledAppointments}
            color="#e11d48"
          />
          <StatCard
            icon="star"
            label="Calificación Prom."
            value={stats.averageRating}
            color="#0f766e"
          />
        </View>
      )}

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
          screen="/(admin)/users"
        />
        <DashboardCard
          title="Gestionar Servicios"
          icon="cut-outline"
          screen="/(admin)/AdminServices"
        />
      </View>
    </ScrollView>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Ionicons name={icon} size={32} color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 18,
    color: "#4b5563",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 5,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 4,
  },
  divider: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    marginVertical: 24,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardPressed: {
    backgroundColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 8,
    textAlign: "center",
  },
});
