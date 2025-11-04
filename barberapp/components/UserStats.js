import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import api from "../utils/api";
import { useSessionStore } from "../store/sessionStore";
import { Ionicons } from "@expo/vector-icons";

const UserStats = ({ userId }) => {
  const { session } = useSessionStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session) return;
      try {
        const url = userId ? `/stats/user/${userId}` : "/stats/user";
        const { data } = await api.get(url);
        setStats(data);
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
      setLoading(false);
    };

    fetchStats();
  }, [session, userId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#e63946" />;
  }

  if (!stats) {
    return <Text>No statistics available.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Statistics</Text>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done-circle" size={32} color="#2a9d8f" />
          <Text style={styles.statValue}>{stats.completedAppointments}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={32} color="#e76f51" />
          <Text style={styles.statValue}>{stats.canceledAppointments}</Text>
          <Text style={styles.statLabel}>Canceled</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="apps" size={32} color="#f4a261" />
          <Text style={styles.statValue}>{stats.totalAppointments}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        {stats.mostUsedBarber && (
          <View style={styles.statCardFull}>
            <Ionicons name="heart" size={32} color="#e63946" />
            <Text style={styles.statValue}>{stats.mostUsedBarber.name}</Text>
            <Text style={styles.statLabel}>
              Favorite Barber ({stats.mostUsedBarber.appointments} appointments)
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  statCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    width: "30%",
    marginBottom: 16,
  },
  statCardFull: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    width: "95%",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
    textAlign: "center",
  },
});

export default UserStats;
