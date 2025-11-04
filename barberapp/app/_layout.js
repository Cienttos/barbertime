import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Las rutas principales son manejadas por los grupos (tabs) y (auth) */}
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(client)" />
      <Stack.Screen name="(barber)" />
      <Stack.Screen name="(admin)" />
      {/* El index principal actúa como un splash/loading screen y guardián de rutas */}
      <Stack.Screen name="index" />
    </Stack>
  );
}
