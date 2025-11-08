import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  StyleSheet,
} from "react-native";
import { useSessionStore } from "../../store/sessionStore";
import api from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // AppointmentDetailModal is not used here
export default function BarberAppointmentsScreen() {
  const { session } = useSessionStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [filter, setFilter] = useState("Próximas"); // Próximas, Completadas, Canceladas
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (session) {
      fetchAppointments();
    }
  }, [session]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/api/appointments/barber/${session.user.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      setAppointments(response.data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar tus citas.");
      console.error("Error fetching barber appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filter by status
    if (filter === "Próximas") {
      filtered = filtered.filter(
        (item) => item.status === "Reservado" || item.status === "En Proceso"
      );
    } else if (filter === "Completadas") {
      filtered = filtered.filter((item) => item.status === "Completado");
    } else if (filter === "Canceladas") {
      filtered = filtered.filter((item) => item.status === "Cancelado");
    }

    // Filter by search query (client name)
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.client?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [appointments, filter, searchQuery]);

  const openDetailModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Cargando tus turnos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- Header Fijo --- */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="calendar-outline" size={24} color="#0052cc" />
          <Text style={styles.title}>Mis Turnos</Text>
        </View>
      </View>

      {/* --- Contenido Desplazable --- */}
      {filteredAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            No se encontraron turnos con los filtros actuales.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openDetailModal(item)}
              style={({ pressed }) => [
                styles.appointmentCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardHeader}>
                <Image
                  source={{
                    uri:
                      item.client?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${item.client?.full_name}`,
                  }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.clientName}>
                    {item.client?.full_name}
                  </Text>
                  <Text style={styles.serviceName}>{item.services?.name}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.statusText,
                      styles[`status${item.status.replace(" ", "")}`],
                    ]}
                  >
                    {item.status}
                  </Text>
                  {item.status === "Completado" && item.notes?.rating && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text style={styles.ratingBadgeText}>
                        {item.notes.rating}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: "white",
    borderBottomWidth: 4,
    borderBottomColor: "#e63946",
    borderStyle: "solid",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 5,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
  },
  refreshButton: {
    padding: 8,
  },
  filterSection: {},
  searchInput: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  filterButtonText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#374151",
  },
  filterButtonTextActive: {
    color: "white",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    margin: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 18,
    marginTop: 16,
  },
  listContentContainer: {
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  cardPressed: {
    backgroundColor: "#f9fafb",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  serviceName: {
    fontSize: 16,
    color: "#4b5563",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  statusCompletado: { color: "#7e22ce" }, // Consistent with my-appointments.js
  statusReservado: { color: "#2563eb" },
  statusEnProceso: { color: "#16a34a" },
  statusCancelado: { color: "#dc2626" },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingBadgeText: {
    marginLeft: 4,
    color: "#b45309",
    fontWeight: "bold",
    fontSize: 14,
  },
  // Added for star display
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
});
