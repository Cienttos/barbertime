import { Stack } from "expo-router";

export default function AuthLayout() {
  // Este layout no muestra header en las pantallas de login/registro
  return <Stack screenOptions={{ headerShown: false }} />;
}
