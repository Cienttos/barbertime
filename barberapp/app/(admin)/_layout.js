import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0052cc", // Azul para el texto activo
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ focused, size }) => {
          let iconName; // El color del ícono se manejará por separado

          if (route.name === "AdminBarbershop") {
            const iconColor = focused ? "#e63946" : "gray";
            return (
              <MaterialCommunityIcons
                name="store-edit-outline"
                size={size}
                color={iconColor}
              />
            );
          }

          if (route.name === "AdminDashboard") {
            iconName = "stats-chart-outline";
          } else if (route.name === "AdminUsers") {
            iconName = "people-outline";
          } else if (route.name === "AdminProfile") {
            iconName = "person-circle-outline";
          } else if (route.name === "AdminBarbershop") {
            // This case is now handled above
          } else if (route.name === "AdminServices") {
            iconName = "cut-outline"; // Icon for Services
          } else if (route.name === "AdminAppointments") {
            iconName = "calendar-outline"; // Icon for Appointments
          }

          // Si la pestaña está seleccionada (focused), el ícono es rojo. Si no, es gris.
          const iconColor = focused ? "#e63946" : "gray";
          return <Ionicons name={iconName} size={size} color={iconColor} />;
        },
      })}
    >
      <Tabs.Screen name="AdminDashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="AdminUsers" options={{ title: "Usuarios" }} />
      <Tabs.Screen name="AdminBarbershop" options={{ title: "Barbería" }} />
      <Tabs.Screen name="AdminServices" options={{ title: "Servicios" }} />
      <Tabs.Screen name="AdminAppointments" options={{ title: "Turnos" }} />
      <Tabs.Screen name="AdminProfile" options={{ title: "Perfil" }} />

      {/* Rutas que no aparecen en el Tab Bar */}
      <Tabs.Screen
        name="AdminCompleteProfile"
        options={{
          href: null,
          tabBarLabel: () => null,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="[id]"
        options={{
          href: null,
          tabBarLabel: () => null,
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
