import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const palette = {
  primary: "#0052cc",
  secondary: "#e63946",
  gray: "gray",
};

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary, // Azul para activo, para que el rojo de Reservar destaque
        tabBarInactiveTintColor: palette.gray,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "ClientDashboard") {
            iconName = "home-outline";
          } else if (route.name === "ClientBookAppointment") {
            iconName = "add-circle-outline";
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
      <Tabs.Screen
        name="ClientBookAppointment"
        options={{ title: "Reservar" }}
      />
      <Tabs.Screen
        name="ClientMyAppointments"
        options={{ title: "Mis Turnos" }}
      />
      <Tabs.Screen name="ClientProfile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
