import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  StyleSheet,
} from "react-native";
import { useSessionStore } from "../../store/sessionStore";
import api from "../../utils/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function UsersManagementScreen() {
  const { session } = useSessionStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [filter, setFilter] = useState("Todos"); // Todos, Clientes, Barberos, Admins
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRes = await api.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      console.log("Raw Users API Response:", usersRes.data);
      setUsers(usersRes.data);
      console.log("Updated Users State:", usersRes.data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los usuarios.");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    console.log("Filtering Users. Initial count:", filtered.length);

    if (filter !== "Todos") {
      const roleMapping = {
        Clientes: "client",
        Barberos: "barber",
        Admins: "admin",
      };
      filtered = filtered.filter((user) => user.role === roleMapping[filter]);
      console.log("Filtered by role (", filter, ") count:", filtered.length);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log(
        "Filtered by search query (",
        searchQuery,
        ") count:",
        filtered.length
      );
    }
    console.log("Final Filtered Users count:", filtered.length);
    return filtered;
  }, [users, filter, searchQuery]);

  useEffect(() => {
    console.log("Rendering with filteredUsers:", filteredUsers.length);
  }, [filteredUsers]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0052cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- Header Fijo --- */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="people-outline" size={24} color="#0052cc" />
          <Text style={styles.title}>Gestión de Usuarios</Text>
        </View>
      </View>

      {/* --- Contenido Desplazable --- */}
      <View style={styles.content}>
        {/* Filter and Search UI */}
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>Filtrar Usuarios</Text>
            <Ionicons name="search-outline" size={24} color="#e63946" />
          </View>
          <TextInput
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <View style={styles.filterButtonsContainer}>
            {["Todos", "Clientes", "Barberos", "Admins"].map((roleFilter) => (
              <Pressable
                key={roleFilter}
                onPress={() => setFilter(roleFilter)}
                style={[
                  styles.filterButton,
                  filter === roleFilter && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === roleFilter && styles.filterButtonTextActive,
                  ]}
                >
                  {roleFilter}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, styles.listCard]}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>Lista de Usuarios</Text>
            <Ionicons name="list-outline" size={24} color="#0052cc" />
          </View>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: `/(admin)/${item.id}`,
                    params: { user: JSON.stringify(item) },
                  })
                }
                style={({ pressed }) => [
                  styles.userCard,
                  pressed && styles.userCardPressed,
                ]}
              >
                {(() => {
                  const roleInfo = {
                    barber: { icon: "cut-outline", color: "#0052cc" },
                    admin: {
                      icon: "shield-checkmark-outline",
                      color: "#e63946",
                    },
                    client: { icon: "person-outline", color: "#6b7280" },
                  };
                  const currentRole = roleInfo[item.role] || roleInfo.client;
                  return (
                    <>
                      <LinearGradient
                        colors={["#e63946", "#ffffff", "#0052cc"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarWrapper}
                      >
                        <Image
                          source={{
                            uri:
                              item.avatar_url ||
                              `https://ui-avatars.com/api/?name=${
                                item.full_name || item.email
                              }&background=random`,
                          }}
                          style={styles.avatar}
                        />
                      </LinearGradient>
                      <View>
                        <Text style={styles.userName}>
                          {item.full_name || "Usuario sin nombre"}
                        </Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                        <View style={styles.roleContainer}>
                          <Ionicons
                            name={currentRole.icon}
                            size={16}
                            color={currentRole.color}
                          />
                          <Text
                            style={[
                              styles.userRole,
                              { color: currentRole.color },
                            ]}
                          >
                            {item.role}
                          </Text>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  No se encontraron usuarios.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    flex: 1,
    padding: 16,
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
  cardTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#334155",
  },
  filterContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButtonActive: {
    backgroundColor: "#0052cc",
  },
  filterButtonText: {
    fontWeight: "600",
    color: "#374151",
  },
  filterButtonTextActive: {
    color: "white",
  },
  listCard: {
    flex: 1,
    marginTop: 16,
  },
  userCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  userCardPressed: {
    backgroundColor: "#f9fafb",
  },
  avatarWrapper: {
    width: 58, // Tamaño del contenedor del gradiente
    height: 58,
    borderRadius: 30,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 56, // 2px más pequeño que el wrapper para crear el borde
    height: 56,
    borderRadius: 28,
    // El fondo blanco es importante si la imagen tiene transparencias
    backgroundColor: "white",
  },
  userName: {
    fontWeight: "600",
    fontSize: 18,
    color: "#1f2937",
  },
  userEmail: {
    color: "#4b5563",
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  userRole: {
    fontStyle: "italic",
    textTransform: "capitalize",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 18,
    marginTop: 16,
  },
});
