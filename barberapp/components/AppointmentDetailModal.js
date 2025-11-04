import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSessionStore } from "../store/sessionStore";
import api from "../utils/api";
import { DateTime } from "luxon";

// Este componente es una versión adaptada del modal que ya existía en my-appointments.js
export default function AppointmentDetailModal({
  visible,
  onClose,
  appointment,
  onRatePress,
  onAppointmentUpdate,
}) {
  const { session, profile } = useSessionStore();
  const router = useRouter();

  if (!appointment) return null; // Add a guard clause

  const handleNavigateToProfile = (userObject) => {
    if (!userObject || profile.role !== "admin") return;
    onClose(); // Close modal before navigating
    router.push({
      pathname: `/${userObject.id}`,
      params: { user: JSON.stringify(userObject) },
    });
  };

  const getAbbreviatedName = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
      : name;
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.put(`/api/appointments/${appointment.id}/status`, {
        status: newStatus,
      });
      Alert.alert("Éxito", `La cita ha sido marcada como ${newStatus}.`);
      onAppointmentUpdate();
      onClose();
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado de la cita.");
    }
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert(
        "Error",
        "El cliente no ha proporcionado un número de teléfono."
      );
    }
  };

  const handleCancelAppointment = async () => {
    Alert.alert(
      "Cancelar Turno",
      "¿Estás seguro de que quieres cancelar esta cita?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.put(`/api/appointments/${appointment.id}/status`, {
                status: "Cancelado",
              });
              Alert.alert("Éxito", "Turno cancelado.");
              onAppointmentUpdate();
              onClose();
            } catch (error) {
              Alert.alert(
                "Error",
                `No se pudo cancelar el turno: ${
                  error.response?.data?.message || "Error desconocido"
                }`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Detalle del Turno</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={30} color="#9CA3AF" />
            </Pressable>
          </View>
          <ScrollView style={{ width: "100%" }}>
            <View style={modalStyles.userInfoContainer}>
              <Pressable
                style={modalStyles.profilePressable}
                onPress={() => handleNavigateToProfile(appointment.client)}
                disabled={profile.role !== "admin"}
              >
                <Image
                  source={{
                    uri:
                      appointment.client?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${appointment.client?.full_name}`,
                  }}
                  style={modalStyles.modalAvatar}
                />
                <View>
                  <Text style={modalStyles.userRoleLabel}>Cliente</Text>
                  <Text style={modalStyles.userNameText}>
                    {getAbbreviatedName(appointment.client?.full_name)}
                  </Text>
                </View>
              </Pressable>
              <View style={modalStyles.separator} />
              <Pressable
                style={modalStyles.profilePressable}
                onPress={() => handleNavigateToProfile(appointment.barber)}
                disabled={profile.role !== "admin"}
              >
                <Image
                  source={{
                    uri:
                      appointment.barber?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${appointment.barber?.full_name}`,
                  }}
                  style={modalStyles.modalAvatar}
                />
                <View>
                  <Text style={modalStyles.userRoleLabel}>Barbero</Text>
                  <Text style={modalStyles.userNameText}>
                    {getAbbreviatedName(appointment.barber?.full_name)}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={modalStyles.detailsSection}>
              <Text style={modalStyles.detailServiceText}>
                {appointment.services?.name} -{" "}
                <Text style={{ color: "#16a34a" }}>
                  ${appointment.price ?? appointment.services?.price}
                </Text>
              </Text>
              <Text style={modalStyles.detailText}>
                <Ionicons name="calendar-outline" size={20} />{" "}
                {DateTime.fromISO(appointment.appointment_date)
                  .setLocale("es")
                  .toFormat("cccc, d 'de' MMMM 'de' yyyy")}
              </Text>
              <Text style={modalStyles.detailText}>
                <Ionicons name="time-outline" size={20} />{" "}
                {appointment.start_time.substring(0, 5)} -{" "}
                {appointment.end_time.substring(0, 5)}
              </Text>
              <Text
                style={[
                  modalStyles.modalStatus,
                  {
                    color:
                      appointment.status === "Completado"
                        ? "#9333ea"
                        : appointment.status === "Reservado"
                        ? "#2563eb"
                        : appointment.status === "En Proceso"
                        ? "#16a34a"
                        : "#dc2626",
                  },
                ]}
              >
                Estado: {appointment.status}
              </Text>
            </View>

            {/* --- Barber Actions --- */}
            {profile.role === "barber" && (
              <View style={modalStyles.actionsContainer}>
                {(appointment.status === "Reservado" ||
                  appointment.status === "En Proceso") && (
                  <Pressable
                    onPress={() => handleCall(appointment.client?.phone_number)}
                    style={[modalStyles.actionButton, modalStyles.callButton]}
                  >
                    <Ionicons name="call" size={20} color="white" />
                    <Text style={modalStyles.actionButtonText}>
                      Llamar Cliente
                    </Text>
                  </Pressable>
                )}
                {appointment.status === "Reservado" && (
                  <Pressable
                    onPress={() => handleUpdateStatus("En Proceso")}
                    style={[
                      modalStyles.actionButton,
                      modalStyles.inProcessButton,
                    ]}
                  >
                    <Text style={modalStyles.actionButtonText}>
                      Marcar como "En Proceso"
                    </Text>
                  </Pressable>
                )}
                {appointment.status === "En Proceso" && (
                  <Pressable
                    onPress={() => handleUpdateStatus("Completado")}
                    style={[
                      modalStyles.actionButton,
                      modalStyles.completeButton,
                    ]}
                  >
                    <Text style={modalStyles.actionButtonText}>
                      Marcar como "Completado"
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* --- Rating Section for Client --- */}
            {profile.role === "client" &&
              appointment.status === "Completado" &&
              !appointment.notes?.rating && (
                <View style={modalStyles.actionsContainer}>
                  <Pressable
                    onPress={onRatePress}
                    style={[modalStyles.actionButton, modalStyles.rateButton]}
                  >
                    <Ionicons name="star-outline" size={20} color="white" />
                    <Text style={modalStyles.actionButtonText}>
                      Calificar Servicio
                    </Text>
                  </Pressable>
                </View>
              )}

            {/* --- Cancel Section --- */}
            {appointment.status === "Reservado" && (
              <Pressable
                onPress={handleCancelAppointment}
                style={[modalStyles.actionButton, modalStyles.cancelButton]}
              >
                <Text style={modalStyles.actionButtonText}>Cancelar Turno</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  userInfoContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 16,
  },
  profilePressable: {
    alignItems: "center",
    gap: 8,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  userRoleLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  userNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  separator: {
    width: 1,
    height: "80%",
    backgroundColor: "#e2e8f0",
  },
  detailsSection: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: "#334155",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  detailServiceText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#334155",
    marginBottom: 12,
  },
  modalStatus: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#e11d48",
  },
  rateButton: {
    backgroundColor: "#f59e0b",
  },
  actionsContainer: {
    marginTop: 16,
    gap: 10,
  },
  callButton: { backgroundColor: "#16a34a" },
  inProcessButton: { backgroundColor: "#2563eb" },
  completeButton: { backgroundColor: "#7e22ce" },
});
