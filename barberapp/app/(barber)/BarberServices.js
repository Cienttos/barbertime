import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSessionStore } from "../../store/sessionStore";
import api from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";

export default function BarberServicesScreen() {
  const { session, profile, setProfile } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allServices, setAllServices] = useState([]);
  const [offeredServices, setOfferedServices] = useState([]);

  useEffect(() => {
    if (session) {
      fetchInitialData();
    }
  }, [session]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const servicesRes = await api.get("/api/services"); // Corrected to include /api prefix
      setAllServices(servicesRes.data);

      if (profile?.extra_data?.offered_services) {
        setOfferedServices(profile.extra_data.offered_services);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelection = (serviceId) => {
    setOfferedServices((prev) => {
      const isSelected = prev.includes(serviceId);
      return isSelected
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId];
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const updatedProfileData = {
        ...profile,
        extra_data: {
          ...profile.extra_data,
          offered_services: offeredServices,
        },
      };
      await api.put("/api/profile", updatedProfileData, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setProfile(updatedProfileData); // Update local store
      Alert.alert("Éxito", "Tus servicios han sido actualizados.");
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
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
        <View style={styles.titleContainer}>
          <Ionicons name="cut-outline" size={24} color="#0052cc" />
          <Text style={styles.title}>Mis Servicios</Text>
        </View>
      </View>

      {/* --- Contenido Desplazable --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.card}>
          {allServices.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => handleServiceSelection(service.id)}
              style={({ pressed }) => [
                styles.serviceItem,
                pressed && styles.serviceItemPressed,
              ]}
            >
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceMeta}>
                  {service.duration_minutes} min - ${service.price}
                </Text>
              </View>
              <Ionicons
                name={
                  offeredServices.includes(service.id)
                    ? "checkbox-sharp"
                    : "square-outline"
                }
                size={28}
                color={
                  offeredServices.includes(service.id) ? "#0052cc" : "#9CA3AF"
                }
              />
            </Pressable>
          ))}
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
            <Text style={styles.saveButtonText}>Guardar Servicios</Text>
          )}
        </Pressable>
      </View>
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
    gap: 12,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  serviceItemPressed: {
    backgroundColor: "#f3f4f6",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  serviceMeta: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
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
