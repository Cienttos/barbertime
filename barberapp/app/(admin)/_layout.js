import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0052cc", // Azul para admin
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "AdminDashboard") {
            iconName = "stats-chart-outline";
          } else if (route.name === "AdminUsers") {
            iconName = "people-outline";
          } else if (route.name === "AdminProfile") {
            iconName = "person-circle-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="AdminDashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="AdminUsers" options={{ title: "Usuarios" }} />
      <Tabs.Screen name="AdminProfile" options={{ title: "Perfil" }} />

      {/* Rutas que no aparecen en el Tab Bar */}
      <Tabs.Screen name="AdminBarbershop" options={{ href: null }} />
      <Tabs.Screen name="AdminServices" options={{ href: null }} />
      <Tabs.Screen name="AdminCompleteProfile" options={{ href: null }} />
      <Tabs.Screen name="[id]" options={{ href: null }} />
    </Tabs>
  );
}
