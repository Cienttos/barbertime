import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

const BACKEND_URL = "http://192.168.0.69:3000";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    console.log("📝 [Register] Iniciando registro con Email vía Backend.");
    try {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          "Registro Exitoso",
          result.message || "Revisa tu correo para confirmar tu cuenta."
        );
        router.push("/(auth)/login");
      } else {
        Alert.alert("Error", result.error || "Error al registrarse.");
      }
    } catch (error) {
      console.error("💥 [Register] Error de red al registrarse:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 px-6">
      <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <Text className="mb-6 text-center text-3xl font-bold text-gray-800">
          Registrarse
        </Text>

        <TextInput
          placeholder="usuario@ejemplo.com"
          className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-gray-800"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="••••••••"
          secureTextEntry
          className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-gray-800"
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Confirmar contraseña"
          secureTextEntry
          className="mb-6 rounded-xl border border-gray-300 px-4 py-3 text-gray-800"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          className="rounded-xl bg-blue-600 py-3 active:bg-blue-700"
        >
          <Text className="text-center text-lg font-semibold text-white">
            {loading ? "Registrando..." : "Crear cuenta"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/login")}
          className="mt-4 py-2"
        >
          <Text className="text-center text-blue-600">
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
