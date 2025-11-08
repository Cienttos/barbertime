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
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarMimeType, setAvatarMimeType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhoneNumber(profile.phone_number || "");
      setAvatarUri(profile.avatar_url || null);
      setAvatarMimeType(null);
    } else if (session?.user?.user_metadata?.picture && !avatarUri) {
      // If Google login and no profile yet, use Google avatar as initial
      setAvatarUri(session.user.user_metadata.picture);
      setAvatarMimeType("image/jpeg"); // Assume Google avatar is jpeg
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      setAvatarMimeType(result.assets[0].mimeType);
    }
  };

  const launchImageLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      setAvatarMimeType(result.assets[0].mimeType);
    }
  };

  const uploadAvatar = async () => {
    // 1. Validar que haya una URI de avatar y una sesión activa.
    if (!avatarUri || !session) return null;

    // 2. Evitar re-subir una imagen que ya está en Supabase.
    // Si la URI del avatar ya es una URL pública y no ha cambiado, no hacemos nada.
    if (avatarUri.startsWith("http") && avatarUri === profile?.avatar_url) {
      return avatarUri;
    }

    setUploading(true);
    try {
      // 3. Crear un objeto FormData para enviar el archivo.
      const formData = new FormData();

      // 4. Adjuntar la imagen al FormData.
      // Se especifica la URI local, el nombre del archivo y el tipo de contenido.
      const fileExtension = avatarUri.split(".").pop();
      const fileName = `avatar.${fileExtension}`;

      console.log(
        `[uploadAvatar] Preparing to upload: uri=${avatarUri}, mimeType=${avatarMimeType}, fileName=${fileName}`
      );

      formData.append("avatar", {
        uri: avatarUri,
        name: fileName,
        type: avatarMimeType || `image/${fileExtension}`,
      });

      // 5. Enviar la petición POST al backend.
      // El endpoint "/api/profile/avatar" está protegido y usa `multer` para procesar el archivo.
      console.log(
        `[uploadAvatar] Sending request to /api/profile/avatar with token: Bearer ${session.access_token.substring(
          0,
          20
        )}...`
      );
      const response = await api.post("/api/profile/avatar", formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // 6. Procesar la respuesta del backend.
      if (response.status === 200 || response.status === 201) {
        console.log("✅ Avatar subido con éxito!");
        // El backend devuelve la URL pública del avatar recién subido.
        return response.data.avatar_url;
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Error al subir el avatar."
        );
        return null;
      }
    } catch (error) {
      console.error(
        "💥 Error al subir el avatar:",
        JSON.stringify(error, null, 2)
      );
      if (error.response) {
        console.error("[uploadAvatar] Response data:", error.response.data);
        console.error("[uploadAvatar] Response status:", error.response.status);
      } else if (error.request) {
        console.error("[uploadAvatar] Request data:", error.request);
      } else {
        console.error("[uploadAvatar] Error message:", error.message);
      }
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
        <ActivityIndicator size="large" color="#0052cc" />
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
    color: "#0052cc",
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
    backgroundColor: "#0052cc",
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
