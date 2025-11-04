import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RatingModal({ visible, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleStarPress = (index, event) => {
    const { locationX } = event.nativeEvent;
    const starWidth = 36; // Corresponde al size del Ionicons
    const isHalf = locationX < starWidth / 2;
    const newRating = index + (isHalf ? 0.5 : 1);
    setRating(newRating);
  };

  const handleSave = () => {
    if (rating === 0) {
      Alert.alert("Error", "Por favor, selecciona al menos una estrella.");
      return;
    }
    onSubmit(rating, comment);
    // Reset state for next time
    setRating(0);
    setComment("");
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Califica el Servicio</Text>

          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, i) => {
              let iconName = "star-outline";
              if (rating >= i + 1) {
                iconName = "star";
              } else if (rating >= i + 0.5) {
                iconName = "star-half-sharp";
              }
              return (
                <Pressable key={i} onPressIn={(e) => handleStarPress(i, e)}>
                  <Ionicons name={iconName} size={36} color="#FFC107" />
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Deja un comentario (opcional)"
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <View style={styles.actionsContainer}>
            <Pressable
              onPress={handleClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.button, styles.submitButton]}
            >
              <Text style={styles.buttonText}>Enviar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  starsContainer: { flexDirection: "row", marginBottom: 20 },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 6,
    width: 250,
    height: 80,
    textAlignVertical: "top",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  button: { padding: 12, borderRadius: 12, alignItems: "center", flex: 1 },
  cancelButton: { backgroundColor: "#6b7280", marginRight: 8 },
  submitButton: { backgroundColor: "#2563eb", marginLeft: 8 },
  buttonText: { color: "white", fontWeight: "600" },
});
