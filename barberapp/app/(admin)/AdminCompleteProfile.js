import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSessionStore } from "../../store/sessionStore";
import { useRouter } from "expo-router";
import api from "../../utils/api"; // Importar la instancia de api

export default function CompleteProfile() {
  const { session, profile, setProfile, isLoading } = useSessionStore();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUri, setAvatarUri] = useState(null); // Use avatarUri to store local URI or public URL
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhoneNumber(profile.phone_number || "");
      setAvatarUri(profile.avatar_url || null);
    } else if (session?.user?.user_metadata?.picture && !avatarUri) {
      // If Google login and no profile yet, use Google avatar as initial
      setAvatarUri(session.user.user_metadata.picture);
    }
  }, [profile, session]);

  const pickImage = async () => {
    const options = [
      { text: "Tomar Foto", onPress: () => launchCamera() },
      { text: "Elegir de la Biblioteca", onPress: () => launchImageLibrary() },
      { text: "Cancelar", style: "cancel" },
    ];
    Alert.alert("Seleccionar Avatar", "Elige una opción", options);
  };

  const launchCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const launchImageLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarUri || !session) return null;

    // If the avatarUri is already a public URL (not a local file URI), no need to re-upload
    if (avatarUri.startsWith("http") && avatarUri === profile?.avatar_url) {
      return avatarUri;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: avatarUri,
        name: `avatar-${session.user.id}.webp`,
        type: "image/webp",
      });

      const response = await api.post("/api/upload/avatar", formData, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "multipart/form-data", // Important for FormData
        },
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Éxito", "¡Avatar subido con éxito!");
        return response.data.avatar_url;
      } else {
        Alert.alert(
          // More robust error handling
          "Error",
          response.data?.message ||
            response.data?.error ||
            "Error al subir el avatar."
        );
        return null;
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", "No se pudo subir el avatar.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateProfileData = async (avatarUrlToSave) => {
    try {
      const response = await api.put(
        "/api/profile",
        {
          full_name: fullName,
          phone_number: phoneNumber,
          avatar_url: avatarUrlToSave,
          role: profile?.role || "client",
          extra_data: profile?.extra_data || {},
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;
        Alert.alert("Éxito", "¡Perfil actualizado con éxito!");
        setProfile(data.profile);
        router.replace("/(tabs)");
      } else {
        // More robust error handling
        Alert.alert(
          "Error",
          response.data?.message ||
            response.data?.error ||
            "Error al actualizar el perfil."
        );
      }
    } catch (error) {
      console.error("Network error or server error:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !phoneNumber) {
      Alert.alert("Error", "Por favor, complete todos los campos.");
      return;
    }
    if (!session) {
      Alert.alert("Error", "No se encontró una sesión activa.");
      return;
    }

    setSubmitting(true);
    try {
      let finalAvatarUrl = profile?.avatar_url;

      const isNewLocalImage = avatarUri && avatarUri.startsWith("file:");
      const isGoogleAvatarNotUploaded =
        avatarUri &&
        avatarUri.startsWith("https://lh3.googleusercontent.com/") &&
        !profile?.avatar_url;

      if (isNewLocalImage || isGoogleAvatarNotUploaded) {
        const uploadedAvatarUrl = await uploadAvatar();
        if (uploadedAvatarUrl) {
          finalAvatarUrl = uploadedAvatarUrl;
        }
      }

      await updateProfileData(finalAvatarUrl);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completa tu Perfil</Text>

      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        <Image
          source={{ uri: avatarUri || "https://www.gravatar.com/avatar/?d=mp" }}
          style={styles.avatar}
        />
        <Text style={styles.changeAvatarText}>Cambiar Avatar</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nombre Completo"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Número de Teléfono"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[
          styles.saveButton,
          (submitting || uploading) && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={submitting || uploading}
      >
        {submitting || uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Perfil</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  avatarContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  changeAvatarText: {
    color: "#007bff",
    marginTop: 10,
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#a9a9a9",
  },
});
