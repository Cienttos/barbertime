import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  FlatList,
  Linking,
  ScrollView,
} from "react-native";
import { StyleSheet } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useSession } from "../../hooks/useSession";
import api from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";
import { DateTime } from "luxon";
import AppointmentDetailModal from "../../components/AppointmentDetailModal"; // Import the new component
import { Picker } from "@react-native-picker/picker";

export default function UserDetailScreen() {
  const { id, user: userString } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useSession();

  const [user, setUser] = useState(userString ? JSON.parse(userString) : null);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true); // Always start loading
  const [selectedRole, setSelectedRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      console.log(
        `[UserDetail] 🌀 useEffect triggered. Fetching details for ID: ${id}`
      );
      setLoading(true);
      try {
        const apiUrl = `/api/admin/users/${id}`; // <-- RUTA CORRECTA PARA EL PANEL DE ADMIN
        console.log(`[UserDetail] 🚀 Calling API: ${apiUrl}`);
        // This new endpoint returns profile, stats, and appointments
        const { data } = await api.get(apiUrl, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        console.log(
          "[UserDetail] ✅ API Response Received:",
          JSON.stringify(data, null, 2)
        );

        // El endpoint /api/admin/users/:id devuelve { profile, stats, appointments }
        // Asignamos cada parte al estado correspondiente.
        setUser(data.profile);
        setStats(data.stats);
        setAppointments(data.appointments || []);
        setSelectedRole(data.profile.role);
        console.log("[UserDetail] ✨ States updated.");
      } catch (error) {
        console.error(
          "[UserDetail] ❌ API Error:",
          error.response?.data || error.message
        );
        Alert.alert("Error", "No se pudo cargar la información del usuario.");
        router.back();
      } finally {
        setLoading(false);
        console.log("[UserDetail] 🏁 setLoading(false). Fetch finished.");
      }
    };

    if (id && session) {
      fetchUserDetails();
    } else {
      console.log(
        `[UserDetail] ⚠️ Skipping fetch. ID: ${id}, Session: ${!!session}`
      );
      setLoading(false);
    }
  }, [id, session]); // The dependency array is correct, no changes needed here.

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      Alert.alert("Sin cambios", "No se ha modificado el rol.");
      return;
    }
    setIsSaving(true);
    try {
      await api.put(
        `/api/admin/users/${user.id}/role`,
        { role: selectedRole },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      Alert.alert(
        "Éxito",
        `El rol de ${user.full_name} ha sido actualizado a ${selectedRole}.`
      );
      setUser({ ...user, role: selectedRole });
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el rol del usuario.");
      console.error("Error updating role:", error.response?.data || error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppointmentPress = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  console.log(
    `[UserDetail] render) isLoading: ${loading}, hasUser: ${!!user}, hasStats: ${!!stats}`
  );
  const showLoadingScreen = loading || !user || !stats;
  console.log(
    `[UserDetail]render) 🤔 Show loading screen? -> ${showLoadingScreen}`
  );

  if (showLoadingScreen) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando detalles del usuario...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Detalle de Usuario" }} />
      <ScrollView style={styles.container}>
        <View style={[styles.card, styles.profileCard]}>
          <Image
            source={{
              uri:
                user.avatar_url ||
                `https://ui-avatars.com/api/?name=${
                  user.full_name || user.email
                }`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.fullName}>
            {user.full_name || "Usuario sin nombre"}
          </Text>
          <Text style={styles.email}>{user.email || "Sin email"}</Text>
          <Pressable
            onPress={() =>
              user.phone_number && Linking.openURL(`tel:${user.phone_number}`)
            }
            disabled={!user.phone_number}
          >
            <View style={styles.infoRow}>
              <Ionicons
                name="call-outline"
                size={16}
                color={user.phone_number ? "#2563eb" : "#6b7280"}
              />
              <Text style={styles.infoValue}>
                {user.phone_number || "No especificado"}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* --- Stats Section --- */}
        {user.role === "barber" ? (
          // --- Barber Stats ---
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar-outline"
              label="Turnos Totales"
              value={stats.totalAppointments || 0}
              color="#2563eb"
            />
            <StatCard
              icon="cash-outline"
              label="Ganancias"
              value={`$${(stats.totalEarnings || 0).toFixed(2)}`}
              color="#16a34a"
            />
            <StatCard
              icon="star-outline"
              label="Rating"
              value={stats.averageRating || 0}
              color="#f59e0b"
            />
          </View>
        ) : (
          // --- Client/Admin Stats ---
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon="checkmark-done-outline"
                label="Completados"
                value={stats.completed || 0}
                color="#16a34a"
              />
              <StatCard
                icon="close-outline"
                label="Cancelados"
                value={stats.cancelled || 0}
                color="#e11d48"
              />
              <StatCard
                icon="cash-outline"
                label="Gasto Total"
                value={`$${(stats.totalSpent || 0).toFixed(2)}`}
                color="#2563eb"
              />
            </View>

            {stats.favoriteBarber && (
              <View style={[styles.card, styles.favBarberCard]}>
                <Text style={styles.cardTitle}>Barbero Favorito</Text>
                <View style={styles.favBarberInfo}>
                  <Image
                    source={{
                      uri:
                        stats.favoriteBarber.avatar ||
                        `https://ui-avatars.com/api/?name=${stats.favoriteBarber.name}`,
                    }}
                    style={styles.favBarberAvatar}
                  />
                  <Text style={styles.favBarberName}>
                    {stats.favoriteBarber.name}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* --- Appointments History --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historial de Turnos</Text>
          {appointments.length > 0 ? (
            <FlatList
              data={appointments}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <AppointmentItem
                  appointment={item}
                  onPress={handleAppointmentPress}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <Text style={styles.noAppointmentsText}>
              Este usuario aún no tiene turnos.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cambiar Rol</Text>
          <Text style={styles.currentRoleText}>
            Rol Actual: <Text style={styles.roleValue}>{user.role}</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRole}
              onValueChange={(itemValue) => setSelectedRole(itemValue)}
            >
              <Picker.Item label="Cliente" value="client" />
              <Picker.Item label="Barbero" value="barber" />
              <Picker.Item label="Administrador" value="admin" />
            </Picker>
          </View>
          <Pressable
            onPress={handleRoleChange}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.button,
              isSaving && styles.buttonDisabled,
              pressed && !isSaving && styles.buttonPressed,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Guardar Rol</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      {selectedAppointment && (
        <AppointmentDetailModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          appointment={selectedAppointment}
          // No refresh function needed here as we are not modifying data
          onAppointmentUpdate={() => {}}
        />
      )}
    </>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={28} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
); // <-- Semicolon added here

const AppointmentItem = ({ appointment, onPress }) => (
  <Pressable
    onPress={() => onPress(appointment)}
    style={({ pressed }) => [
      styles.appointmentItem,
      pressed && styles.appointmentItemPressed,
    ]}
  >
    <>
      <View style={styles.appointmentDetails}>
        <Text style={styles.appointmentService}>
          {appointment.services?.name || "Servicio no disponible"}
        </Text>
        <Text style={styles.appointmentBarber}>
          con {appointment.barber?.full_name || "Barbero no disponible"}
        </Text>
        <Text style={styles.appointmentDate}>
          {DateTime.fromISO(appointment.appointment_date)
            .setLocale("es")
            .toFormat("d 'de' MMMM, yyyy")}{" "}
          a las {appointment.start_time.substring(0, 5)}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          styles[`status${appointment.status.replace(" ", "")}`],
        ]}
      >
        <Text style={styles.statusBadgeText}>{appointment.status}</Text>
      </View>
    </>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  profileCard: {
    alignItems: "center",
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#bfdbfe",
  },
  fullName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  email: {
    fontSize: 18,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 18,
    color: "#1f2937",
  },
  currentRoleText: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 8,
  },
  roleValue: {
    fontSize: 16,
    color: "#1f2937",
    textTransform: "capitalize",
    fontWeight: "bold",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#2563eb",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonPressed: {
    backgroundColor: "#1d4ed8",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  favBarberCard: {
    alignItems: "center",
  },
  favBarberInfo: {
    alignItems: "center",
    gap: 8,
  },
  favBarberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  favBarberName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  appointmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  appointmentItemPressed: {
    backgroundColor: "#f3f4f6",
  },
  appointmentDetails: {
    flex: 1,
    gap: 2,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  appointmentBarber: {
    fontSize: 14,
    color: "#4b5563",
  },
  appointmentDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginLeft: 12,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusCompletado: { backgroundColor: "#9333ea" },
  statusReservado: { backgroundColor: "#2563eb" },
  statusEnProceso: { backgroundColor: "#16a34a" },
  statusCancelado: { backgroundColor: "#dc2626" },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  noAppointmentsText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
    paddingVertical: 20,
  },
});
