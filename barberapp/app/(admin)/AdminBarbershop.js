import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSession } from "../../hooks/useSession";
import api from "../../utils/api";

export default function AdminBarbershop() {
  const { session } = useSession();
  const [shopData, setShopData] = useState({
    name: "",
    address: "",
    phone: "",
    opening_time: "",
    closing_time: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchShopData = async () => {
      if (!session) return;
      try {
        setLoading(true);
        const { data } = await api.get("/api/admin/general", {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        setShopData(data);
      } catch (error) {
        console.error("Error fetching barbershop data:", error);
        Alert.alert("Error", "No se pudieron cargar los datos de la barbería.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [session]);

  const handleSave = async () => {
    if (!session) return;
    try {
      setIsSaving(true);
      await api.put("/api/admin/general", shopData, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      Alert.alert("Éxito", "Los datos de la barbería se han actualizado.");
    } catch (error) {
      console.error("Error saving barbershop data:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setShopData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nombre de la Barbería</Text>
      <TextInput
        style={styles.input}
        value={shopData.name}
        onChangeText={(text) => handleInputChange("name", text)}
      />
      <Text style={styles.label}>Dirección</Text>
      <TextInput
        style={styles.input}
        value={shopData.address}
        onChangeText={(text) => handleInputChange("address", text)}
      />
      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={shopData.phone}
        onChangeText={(text) => handleInputChange("phone", text)}
        keyboardType="phone-pad"
      />
      {/* Aquí podrías añadir selectores de hora para opening/closing time */}
      <Button
        title={isSaving ? "Guardando..." : "Guardar Cambios"}
        onPress={handleSave}
        disabled={isSaving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
});
