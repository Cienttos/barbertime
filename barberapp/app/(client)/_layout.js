import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#e63946", // Rojo para activo
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "ClientDashboard") {
            iconName = "home-outline";
          } else if (route.name === "ClientMyAppointments") {
            iconName = "calendar-outline";
          } else if (route.name === "ClientProfile") {
            iconName = "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="ClientDashboard" options={{ title: "Inicio" }} />
      <Tabs.Screen name="ClientBookAppointment" options={{ href: null }} />
      <Tabs.Screen
        name="ClientMyAppointments"
        options={{ title: "Mis Turnos" }}
      />
      <Tabs.Screen name="ClientProfile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
