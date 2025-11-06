import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminAppointments() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Turnos (Admin)</Text>
      {/* Aquí irá la lógica para mostrar y gestionar los turnos */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
