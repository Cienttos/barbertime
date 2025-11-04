import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import { useSessionStore } from "../../store/sessionStore";
import { Ionicons } from "@expo/vector-icons";
import api from "../../utils/api";
import DateTimePicker from "@react-native-community/datetimepicker";

const daysOfWeek = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function BarberAvailabilityScreen() {
  const { session, profile, setProfile } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shopSettings, setShopSettings] = useState(null);
  const [barberAvailability, setBarberAvailability] = useState({});

  // State for time picker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerConfig, setTimePickerConfig] = useState({
    day: "",
    type: "",
  });

  useEffect(() => {
    if (session) {
      fetchInitialData();
    }
  }, [session]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Para una ruta pública, no es necesario enviar el token de autorización.
      const shopRes = await api.get("/api/public/shop-info");

      const shopData = shopRes.data?.data || shopRes.data;
      setShopSettings(shopData);

      if (profile?.extra_data?.availability) {
        setBarberAvailability(profile.extra_data.availability);
      } else if (shopData?.working_hours) {
        // Pre-fill with shop hours if barber has no settings
        const initialAvailability = {};
        for (const day in shopData.working_hours) {
          initialAvailability[day] = {
            enabled: false,
            open: shopData.working_hours[day].open,
            close: shopData.working_hours[day].close,
          };
        }
        setBarberAvailability(initialAvailability);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos de la barbería.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setBarberAvailability((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [field]: value },
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);

    // --- VALIDATION LOGIC ---
    for (const dayKey in barberAvailability) {
      const barberDay = barberAvailability[dayKey];
      if (barberDay.enabled) {
        const shopDay = shopSettings.working_hours[dayKey];
        // 1. Check if the shop is open on that day
        if (!shopDay || !shopDay.enabled) {
          Alert.alert(
            "Error de Horario",
            `La tienda está cerrada el ${daysOfWeek[dayKey]}. No puedes asignarte este día.`
          );
          setSaving(false);
          return;
        }
        // 2. Check if barber's hours are within shop hours
        if (barberDay.open < shopDay.open || barberDay.close > shopDay.close) {
          Alert.alert(
            "Error de Horario",
            `Tu horario para el ${daysOfWeek[dayKey]} (${barberDay.open} - ${barberDay.close}) debe estar dentro del horario de la tienda (${shopDay.open} - ${shopDay.close}).`
          );
          setSaving(false);
          return;
        }
      }
    }
    // --- END OF VALIDATION ---

    try {
      const updatedProfileData = {
        ...profile,
        extra_data: {
          ...profile.extra_data,
          availability: barberAvailability,
        },
      };
      await api.put("/api/profile", updatedProfileData, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setProfile(updatedProfileData); // Update local store
      Alert.alert("Éxito", "Tu disponibilidad ha sido guardada.");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar tu disponibilidad.");
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().substring(0, 5);
      handleAvailabilityChange(
        timePickerConfig.day,
        timePickerConfig.type,
        timeString
      );
    }
  };

  const showPicker = (day, type) => {
    setTimePickerConfig({ day, type });
    setShowTimePicker(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- Header Fijo --- */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Horarios</Text>
      </View>

      {/* --- Contenido Desplazable --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.card}>
          {shopSettings?.working_hours &&
            Object.keys(daysOfWeek).map((key) => {
              const dayData = shopSettings.working_hours[key];
              const isShopOpen = dayData && dayData.enabled;
              const isBarberEnabled = barberAvailability[key]?.enabled || false;
              const hasConflict = isBarberEnabled && !isShopOpen;

              return (
                <View
                  key={key}
                  style={[
                    styles.dayContainer,
                    hasConflict && styles.dayContainerConflict,
                  ]}
                >
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>
                      {daysOfWeek[key]}
                    </Text>
                    <Switch
                      value={isBarberEnabled}
                      onValueChange={(value) =>
                        handleAvailabilityChange(key, "enabled", value)
                      }
                      trackColor={{ false: "#767577", true: "#a8dadc" }}
                      thumbColor={isBarberEnabled ? "#0052cc" : "#f4f3f4"}
                    />
                  </View>
                  <Text style={styles.shopHoursText}>
                    Horario de la tienda:{" "}
                    {isShopOpen
                      ? `${dayData.open} - ${dayData.close}`
                      : "Cerrado"}
                  </Text>
                  {isBarberEnabled && isShopOpen && (
                    <View style={styles.timePickerContainer}>
                      <Pressable
                        onPress={() => showPicker(key, "open")}
                        style={styles.timePickerButton}
                      >
                        <Text style={styles.timePickerButtonText}>
                          {barberAvailability[key]?.open || dayData?.open}
                        </Text>
                      </Pressable>
                      <Text style={styles.timePickerSeparator}>-</Text>
                      <Pressable
                        onPress={() => showPicker(key, "close")}
                        style={styles.timePickerButton}
                      >
                        <Text style={styles.timePickerButtonText}>
                          {barberAvailability[key]?.close || dayData?.close}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* --- Footer Fijo --- */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleSaveChanges}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            pressed && !saving && styles.saveButtonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Horarios</Text>
          )}
        </Pressable>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={
            // Usar la hora existente o la hora de apertura/cierre de la tienda como valor inicial
            new Date(
              `1970-01-01T${barberAvailability[timePickerConfig.day]?.[timePickerConfig.type] ||
              shopSettings.working_hours[timePickerConfig.day]?.[timePickerConfig.type] || '09:00'}`
            )
          }
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
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
  header: {
    padding: 16,
    paddingTop: 48,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 100, // Space for the fixed footer
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  dayContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  dayContainerConflict: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  shopHoursText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 16,
  },
  timePickerButton: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timePickerButtonText: {
    color: "#1e40af",
    fontWeight: "bold",
    fontSize: 16,
  },
  timePickerSeparator: {
    color: "#6b7280",
    fontWeight: "bold",
    fontSize: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#ef4444", // Red
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af", // Gray
  },
  saveButtonPressed: {
    backgroundColor: "#dc2626", // Darker Red
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
  },
});
