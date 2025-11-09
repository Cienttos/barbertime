import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSessionStore } from "../../store/sessionStore";
import api from "../../utils/api";
import { Calendar } from "react-native-calendars";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";

const daysOfWeek = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const palette = {
  primary: "#0052cc",
  secondary: "#e63946",
  background: "#f3f4f6",
  text: "#1f2937",
  white: "#fff",
  lightGray: "#f8f9fa",
  gray: "#ced4da",
  darkGray: "#495057",
};

export default function MyScheduleScreen() {
  const { session, profile, setProfile } = useSessionStore();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSchedule = async () => {
    if (!session) return;
    try {
      setLoading(true);
      // Inicializamos el horario desde extra_data o con valores por defecto
      // Usamos el 'profile' que ya tenemos en el store para una carga más rápida
      setSchedule({
        blocked_dates: profile?.extra_data?.blocked_dates || [],
      });
    } catch (error) {
      console.error("Error fetching barber schedule:", error);
      Alert.alert("Error", "No se pudo cargar tu horario.");
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect se asegura de que los datos se recarguen cada vez que se visita la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchSchedule();
    }, [session, profile])
  );

  const handleSave = async () => {
    if (!session) return;
    try {
      setIsSaving(true);
      // CORRECCIÓN: Apuntamos a la ruta correcta definida en el backend para la disponibilidad.
      const url = "/api/barbers/availability"; // Este endpoint actualiza 'availability' y 'blocked_dates'
      const payload = {
        // Mantenemos la disponibilidad existente y solo actualizamos las fechas bloqueadas
        availability: profile?.extra_data?.availability, // Enviar la disponibilidad actual para no perderla
        blocked_dates: schedule.blocked_dates, // Enviar las fechas bloqueadas actualizadas
      };
      console.log(`[FRONTEND] 📤 Enviando datos a: PUT ${url}`);
      console.log(
        "[FRONTEND] 📦 Datos del horario a guardar:",
        JSON.stringify(payload, null, 2)
      );

      const response = await api.put(url, payload, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      // Actualizar el perfil en el store local para reflejar los cambios
      setProfile({
        ...profile,
        extra_data: { ...profile.extra_data, ...payload },
      });

      console.log(
        "[FRONTEND] ✅ Respuesta exitosa del backend:",
        response.data
      );
      Alert.alert("Éxito", "Tu horario se ha actualizado correctamente.");
    } catch (error) {
      console.error("[FRONTEND] 💥 Error al guardar el horario:", error);
      if (error.response) {
        console.error("[FRONTEND] Datos del error:", error.response.data);
      }
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDayPress = (day) => {
    const date = day.dateString;
    const newBlockedDates = [...(schedule.blocked_dates || [])];
    const index = newBlockedDates.indexOf(date);

    if (index > -1) {
      newBlockedDates.splice(index, 1);
    } else {
      newBlockedDates.push(date);
    }
    setSchedule((prev) => ({ ...prev, blocked_dates: newBlockedDates }));
  };

  const getMarkedDates = () => {
    const marked = {};
    if (schedule?.blocked_dates) {
      schedule.blocked_dates.forEach((date) => {
        marked[date] = { selected: true, selectedColor: palette.secondary };
      });
    }
    return marked;
  };

  if (loading || !schedule) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text>Cargando tu horario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- Header Fijo --- */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="calendar-remove-outline"
            size={24}
            color="#0052cc"
          />
          <Text style={styles.title}>Mis Días Libres</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.form}>
          <Text style={styles.sectionSubtitle}>
            Toca los días en el calendario para marcarlos como no laborables.
          </Text>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            theme={{
              selectedDayBackgroundColor: palette.primary,
              arrowColor: palette.primary,
              todayTextColor: palette.primary,
            }}
          />
        </View>
      </ScrollView>
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Días Libres</Text>
          )}
        </TouchableOpacity>
      </View>{" "}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
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
    shadowRadius: 4,
    elevation: 5,
  },
  titleContainer: {
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
  scrollContentContainer: {
    paddingBottom: 100, // Espacio para el footer fijo
  },
  form: { padding: 20, paddingTop: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: palette.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 20,
    textAlign: "center",
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.gray,
  },
  saveButton: {
    backgroundColor: palette.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: palette.gray },
  saveButtonText: { color: palette.white, fontWeight: "bold", fontSize: 16 },
  card: {
    // Estilos de card eliminados ya que no se usan
  },
});
