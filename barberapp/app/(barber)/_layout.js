import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BarberLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#e63946", // Rojo para activo
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "BarberDashboard") {
            iconName = "grid-outline";
          } else if (route.name === "BarberAppointments") {
            iconName = "calendar-outline";
          } else if (route.name === "BarberProfile") {
            iconName = "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="BarberDashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="BarberAppointments" options={{ title: "Turnos" }} />
      <Tabs.Screen name="BarberProfile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
