import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSessionStore } from "../../store/sessionStore";
import api from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";
import AppointmentDetailModal from "../../components/AppointmentDetailModal";
import RatingModal from "../../components/RatingModal"; // Import the new RatingModal
import { useRouter, useFocusEffect } from "expo-router";
import { DateTime } from "luxon";

export default function AppointmentsScreen() {
  const { session } = useSessionStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isRatingVisible, setIsRatingVisible] = useState(false);

  const [filter, setFilter] = useState("Próximas"); // Próximas, Completadas, Canceladas
  const [searchQuery, setSearchQuery] = useState("");

  const { profile } = useSessionStore();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    // Si es admin, busca todos los turnos. Si no, solo los del cliente.
    const endpoint =
      profile?.role === "admin"
        ? "/api/admin/appointments" // Corrected to include /api prefix
        : "/api/appointments/client"; // Corrected to include /api prefix
    try {
      const response = await api.get(endpoint);
      setAppointments(response.data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar tus citas.");
    } finally {
      setLoading(false);
    }
  }, [session, profile]);

  useFocusEffect(
    useCallback(() => {
      if (session) {
        fetchAppointments();
      }
    }, [session, fetchAppointments])
  );

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

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.services?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.client?.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.barber?.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [appointments, filter, searchQuery]);

  const openDetailModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailVisible(true);
  };

  const handleSaveRating = async (rating, comment) => {
    if (!selectedAppointment) return;
    try {
      await api.put(
        `/api/appointments/${selectedAppointment.id}/notes`, { rating, review_comment: comment }
      );
      Alert.alert("Éxito", "Gracias por tu calificación.");
      setIsRatingVisible(false);
      fetchAppointments(); // Refresh appointments to show new rating
    } catch (error) {
      console.error(
        "[Save Rating] ❌ Error:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        `No se pudo guardar tu calificación: ${
          error.response?.data?.message || "Error desconocido"
        }`
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Cargando citas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          {profile?.role === "admin" ? "Todos los Turnos" : "Mis Turnos"}
        </Text>
        <Pressable onPress={fetchAppointments} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#457b9d" />
        </Pressable>
      </View>

      {/* Filter and Search UI */}
      <View style={styles.filterContainer}>
        <TextInput
          placeholder="Buscar por cliente, barbero o servicio..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <View style={styles.filterButtonsContainer}>
          {["Próximas", "Completadas", "Canceladas"].map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilter(status)}
              style={[
                styles.filterButton,
                filter === status && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === status && styles.filterButtonTextActive,
                ]}
              >
                {status}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filteredAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#a8dadc" />
          <Text style={styles.emptyText}>
            No se encontraron citas con los filtros actuales.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (profile?.role === "admin") {
              // Admin View Card
              return (
                <Pressable
                  onPress={() => openDetailModal(item)}
                  style={({ pressed }) => [
                    styles.appointmentCard,
                    styles.adminAppointmentCard,
                    pressed && styles.appointmentCardPressed,
                  ]}
                >
                  {/* Admin Card Layout - Redesigned */}
                  <View style={styles.adminCardTopSection}>
                    <View style={styles.adminCardRow}>
                      <Image
                        source={{
                          uri:
                            item.client?.avatar_url ||
                            `https://ui-avatars.com/api/?name=${
                              item.client?.full_name || item.client?.email
                            }&background=random`,
                        }}
                        style={styles.adminAvatar}
                      />
                      <View style={styles.adminInfoColumn}>
                        <Text style={styles.adminLabel}>Cliente</Text>
                        <Text style={styles.adminName} numberOfLines={1}>
                          {item.client?.full_name || "Cliente"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.adminCardRow}>
                      <Image
                        source={{
                          uri:
                            item.barber?.avatar_url ||
                            `https://ui-avatars.com/api/?name=${
                              item.barber?.full_name || item.barber?.email
                            }&background=random`,
                        }}
                        style={styles.adminAvatar}
                      />
                      <View style={styles.adminInfoColumn}>
                        <Text style={styles.adminLabel}>Barbero</Text>
                        <Text style={styles.adminName} numberOfLines={1}>
                          {item.barber?.full_name || "Barbero"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.adminDetailsDivider} />
                  <View style={styles.adminCardBottomSection}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.adminDetailItem}>
                        <Ionicons
                          name="cut-outline"
                          size={18}
                          color="#457b9d"
                        />
                        <Text style={styles.adminServiceText} numberOfLines={1}>
                          {item.services?.name}
                        </Text>
                      </View>
                      <View style={styles.adminDetailItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#457b9d"
                        />
                        <Text style={styles.adminServiceText}>
                          {DateTime.fromISO(item.appointment_date)
                            .setLocale("es")
                            .toFormat("dd 'de' MMMM")}{" "}
                          a las {item.start_time.substring(0, 5)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.adminPriceContainer}>
                      <Text style={styles.adminPrice}>
                        ${item.price ?? item.services?.price}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      styles[`status${item.status.replace(" ", "")}`],
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </View>
                </Pressable>
              );
            }
            // Client View Card (Simplified, similar to Barber's)
            return (
              <Pressable
                onPress={() => openDetailModal(item)}
                style={({ pressed }) => [
                  styles.appointmentCard,
                  pressed && styles.appointmentCardPressed,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Image
                    source={{
                      uri:
                        item.barber?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${item.barber?.full_name}`,
                    }}
                    style={styles.barberAvatar}
                  />
                  <View>
                    <Text style={styles.serviceName}>
                      {item.services?.name}
                    </Text>
                    <Text style={styles.barberName}>
                      con {item.barber?.full_name}
                    </Text>
                    <Text style={styles.appointmentDateTime}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#6b7280"
                      />{" "}
                      {DateTime.fromISO(item.appointment_date)
                        .setLocale("es")
                        .toFormat("dd MMM")}{" "}
                      <Ionicons name="time-outline" size={14} color="#6b7280" />{" "}
                      {item.start_time.substring(0, 5)} -{" "}
                      {item.end_time.substring(0, 5)}
                    </Text>
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
            );
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailModal
          visible={isDetailVisible}
          onClose={() => setIsDetailVisible(false)}
          appointment={selectedAppointment} // Pass the selected appointment
          onRatePress={() => {
            setIsDetailVisible(false);
            setIsRatingVisible(true);
          }} // Function to open rating modal
          onAppointmentUpdate={fetchAppointments} // Pass function to refresh list after cancellation
        />
      )}

      {/* Rating Modal is now separate */}
      <RatingModal
        visible={isRatingVisible}
        onClose={() => setIsRatingVisible(false)}
        onSubmit={handleSaveRating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  loadingText: {
    marginTop: 8,
    color: "#475569",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1e293b",
  },
  refreshButton: {
    padding: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "white",
  },
  filterButtonActive: {
    backgroundColor: "#e63946",
  },
  filterButtonText: {
    fontWeight: "600",
    color: "#1e293b",
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
    marginTop: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 18,
    marginTop: 16,
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
    marginBottom: 16,
  },
  adminAppointmentCard: {
    backgroundColor: "#ffffff",
    gap: 12,
  },
  adminCardTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  appointmentCardPressed: {
    backgroundColor: "#f8fafc",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#a8dadc",
  },
  adminCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  adminInfoColumn: {
    flex: 1,
  },
  adminLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  adminName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flexShrink: 1, // Allows text to shrink if needed
  },
  adminDetailsDivider: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  adminServiceText: {
    fontSize: 16,
    color: "#334155",
    flexShrink: 1,
  },
  adminCardBottomSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  adminPriceContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  adminPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#16a34a",
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  barberName: {
    fontSize: 16,
    color: "#475569",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
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
  statusCompletado: { color: "#9333ea" }, // Consistent with barber-appointments.js
  statusReservado: { color: "#457b9d" },
  statusEnProceso: { color: "#16a34a" },
  statusCancelado: { color: "#e63946" },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: "600",
    color: "#9ca3af",
  },
  ratingTextActive: {
    color: "#f59e0b",
  },
  appointmentDateTime: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
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
});
