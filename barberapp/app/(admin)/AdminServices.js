import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSession } from "../../hooks/useSession";
import api from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";

export default function ServicesManagementScreen() {
  const { session } = useSession();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for creating a new service
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  // State for editing an existing service
  const [editingService, setEditingService] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (session) {
      fetchServices();
    }
  }, [session]);

  const fetchServices = async () => {
    console.log("[Services] 🚀 Intentando obtener servicios...");
    setLoading(true);
    try {
      const servicesRes = await api.get("/api/services", {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setServices(servicesRes.data);
      console.log(
        "[Services] ✅ Servicios obtenidos:",
        servicesRes.data.length
      );
    } catch (error) {
      console.error(
        "[Services] ❌ Error al obtener servicios:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName || !newServiceDuration || !newServicePrice) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
    const serviceData = {
      name: newServiceName,
      duration_minutes: parseInt(newServiceDuration),
      price: parseFloat(newServicePrice),
    };
    console.log(
      "[Services] 🚀 Intentando crear servicio con datos:",
      serviceData
    );
    try {
      await api.post("/api/services", serviceData, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      Alert.alert("Éxito", "Servicio creado.");
      console.log("[Services] ✅ Servicio creado exitosamente.");
      setNewServiceName("");
      setNewServiceDuration("");
      setNewServicePrice("");
      fetchServices();
    } catch (error) {
      console.error(
        "[Services] ❌ Error al crear servicio:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        `No se pudo crear el servicio: ${
          error.response?.data?.message || "Error desconocido"
        }`
      );
    }
  };

  const handleOpenEditModal = (service) => {
    setEditingService({
      ...service,
      duration_minutes: service.duration_minutes.toString(),
      price: service.price.toString(),
    });
    setIsModalVisible(true);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    const { id, name, duration_minutes, price } = editingService;

    if (!name || !duration_minutes || !price) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    const updateData = {
      name,
      duration_minutes: parseInt(duration_minutes),
      price: parseFloat(price),
    };
    console.log(
      `[Services] 🚀 Intentando actualizar servicio ID ${id} con datos:`,
      updateData
    );

    try {
      await api.put(`/api/services/${id}`, updateData, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      Alert.alert("Éxito", "Servicio actualizado.");
      console.log(`[Services] ✅ Servicio ID ${id} actualizado.`);
      setIsModalVisible(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error(
        `[Services] ❌ Error al actualizar servicio ID ${id}:`,
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo actualizar el servicio."
      );
    }
  };

  const handleDeleteService = async (serviceId) => {
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de que quieres eliminar este servicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            console.log(
              `[Services] 🚀 Intentando eliminar servicio ID ${serviceId}`
            );
            try {
              await api.delete(`/api/services/${serviceId}`, {
                headers: { Authorization: `Bearer ${session.token}` },
              });
              Alert.alert("Éxito", "Servicio eliminado.");
              console.log(`[Services] ✅ Servicio ID ${serviceId} eliminado.`);
              fetchServices();
            } catch (error) {
              console.error(
                `[Services] ❌ Error al eliminar servicio ID ${serviceId}:`,
                error.response?.data || error.message
              );
              Alert.alert("Error", "No se pudo eliminar el servicio.");
            }
          },
        },
      ]
    );
  };

  const renderListHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="cut-outline" size={24} color="#0052cc" />
          <Text style={styles.title}>Gestión de Servicios</Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={[styles.card, styles.addServiceCard]}>
          <Text style={styles.cardTitle}>Añadir Nuevo Servicio</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del Servicio"
            value={newServiceName}
            onChangeText={setNewServiceName}
          />
          <TextInput
            style={styles.input}
            placeholder="Duración (minutos)"
            keyboardType="numeric"
            value={newServiceDuration}
            onChangeText={setNewServiceDuration}
          />
          <TextInput
            style={styles.input}
            placeholder="Precio"
            keyboardType="numeric"
            value={newServicePrice}
            onChangeText={setNewServicePrice}
          />
          <Pressable
            onPress={handleCreateService}
            style={({ pressed }) => [
              styles.button,
              styles.createButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Añadir Servicio</Text>
          </Pressable>
        </View>
        <Text
          style={[styles.cardTitle, { marginTop: 24, paddingHorizontal: 8 }]}
        >
          Lista de Servicios
        </Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <View style={[styles.card, styles.serviceItem]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#457b9d" />
                  <Text style={styles.serviceMeta}>
                    {item.duration_minutes} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={16} color="#16a34a" />
                  <Text style={[styles.serviceMeta, { color: "#16a34a" }]}>
                    ${item.price}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.serviceActions}>
              <Pressable
                onPress={() => handleOpenEditModal(item)}
                style={styles.actionButton}
              >
                <Ionicons name="create-outline" size={24} color="#457b9d" />
              </Pressable>
              <Pressable
                onPress={() => handleDeleteService(item.id)}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={24} color="#e63946" />
              </Pressable>
            </View>
          </View>
        )}
      />
      {editingService && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={modalStyles.centeredView}>
            <View style={modalStyles.modalView}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>Editar Servicio</Text>
                <Pressable onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close-circle" size={30} color="#9ca3af" />
                </Pressable>
              </View>

              <TextInput
                style={modalStyles.input}
                placeholder="Nombre del Servicio"
                value={editingService.name}
                onChangeText={(text) =>
                  setEditingService((prev) => ({ ...prev, name: text }))
                }
              />
              <TextInput
                style={modalStyles.input}
                placeholder="Duración (minutos)"
                keyboardType="numeric"
                value={editingService.duration_minutes}
                onChangeText={(text) =>
                  setEditingService((prev) => ({
                    ...prev,
                    duration_minutes: text,
                  }))
                }
              />
              <TextInput
                style={modalStyles.input}
                placeholder="Precio"
                keyboardType="numeric"
                value={editingService.price}
                onChangeText={(text) =>
                  setEditingService((prev) => ({ ...prev, price: text }))
                }
              />
              <View style={modalStyles.actionsContainer}>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={[modalStyles.button, modalStyles.cancelButton]}
                >
                  <Text style={modalStyles.buttonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdateService}
                  style={({ pressed }) => [
                    modalStyles.button,
                    modalStyles.saveButton,
                    pressed && modalStyles.buttonPressed,
                  ]}
                >
                  <Text style={[modalStyles.buttonText, { color: "white" }]}>
                    Guardar
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 16,
    paddingTop: 0, // El header ya tiene su propio padding
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
  header: {
    paddingTop: 56, // Aumentado para dar más espacio en la parte superior
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: "white",
    borderBottomWidth: 4,
    borderBottomColor: "#e63946",
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
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "white",
  },
  button: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  createButton: {
    backgroundColor: "#457b9d",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    // El estilo base ahora viene de styles.card
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  metaContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceMeta: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  serviceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "white",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  button: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    marginLeft: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
