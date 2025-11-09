import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

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
          } else if (route.name === "BarberAvailability") {
            // Usamos un ícono de MaterialCommunityIcons para el reloj
            return (
              <MaterialCommunityIcons
                name="clock-time-eight-outline"
                size={size}
                color={color}
              />
            );
          } else if (route.name === "MySchedule") {
            return (
              <MaterialCommunityIcons
                name="calendar-remove-outline"
                size={size}
                color={color}
              />
            );
          } else if (route.name === "BarberServices") {
            iconName = "cut-outline";
          } else if (route.name === "BarberProfile") {
            iconName = "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* El orden de los Screen define el orden en la barra de navegación */}
      <Tabs.Screen name="BarberDashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="BarberAppointments" options={{ title: "Turnos" }} />
      <Tabs.Screen
        name="BarberAvailability"
        options={{ title: "Disponibilidad" }}
      />
      <Tabs.Screen name="MySchedule" options={{ title: "Días Libres" }} />
      <Tabs.Screen name="BarberServices" options={{ title: "Servicios" }} />
      <Tabs.Screen name="BarberProfile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
