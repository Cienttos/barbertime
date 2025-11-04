import React, { useState } from "react";
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { TextInput, Button, Text, Avatar } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";

export default function EditProfileModal({
  visible,
  onClose,
  profile,
  onSave,
}) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone_number || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    onSave({ full_name: fullName, phone_number: phone, avatar_url: avatarUrl });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalContainer}>
        <Text style={styles.title}>Editar perfil</Text>

        <Pressable onPress={pickImage} style={styles.avatarContainer}>
          <Avatar.Image
            size={80}
            source={{
              uri: avatarUrl || "https://www.gravatar.com/avatar/?d=mp&s=80",
            }}
          />
          <Text style={styles.changeAvatar}>Cambiar foto</Text>
        </Pressable>

        <TextInput
          label="Nombre completo"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          mode="outlined"
          style={styles.input}
        />

        <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
          Guardar cambios
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    position: "absolute",
    top: "25%",
    left: "7%",
    right: "7%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  changeAvatar: {
    color: "#2563eb",
    marginTop: 6,
    fontSize: 14,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  saveButton: {
    marginTop: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
});
