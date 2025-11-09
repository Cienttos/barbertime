import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { useSession } from "../../hooks/useSession";
import api from "../../utils/api";
import { Calendar } from "react-native-calendars";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../config/supabase";
import { decode } from "base64-arraybuffer";
import { Card, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

const daysOfWeek = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const palette = {
  primary: "#0052cc",
  secondary: "#e63946",
  background: "#f3f4f6",
  text: "#1f2937",
  white: "#fff",
  lightGray: "#f8f9fa",
  gray: "#ced4da",
  darkGray: "#495057",
};

export default function AdminBarbershop() {
  const { session } = useSession();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [timePickerMode, setTimePickerMode] = useState("open"); // 'open' or 'close'
  const socialMediaScrollRef = useRef(null);

  useEffect(() => {
    const fetchShopData = async () => {
      if (!session) return;
      try {
        setLoading(true);
        const { data } = await api.get("/api/admin/general", {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        setShopData(data);
      } catch (error) {
        console.error("Error fetching barbershop data:", error);
        Alert.alert("Error", "No se pudieron cargar los datos de la barbería.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [session]);

  const handleSave = async () => {
    if (!session) return;
    try {
      setIsSaving(true);
      await api.put("/api/admin/general", shopData, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      Alert.alert("Éxito", "Los datos de la barbería se han actualizado.");
    } catch (error) {
      console.error("Error saving barbershop data:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setShopData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setShopData((prev) => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSocialMediaChange = (index, field, value) => {
    const newSocialMedia = [...shopData.social_media];
    newSocialMedia[index][field] = value;
    setShopData((prev) => ({ ...prev, social_media: newSocialMedia }));
  };

  const addSocialMedia = () => {
    // Se añade un id único temporal para solucionar el warning de la 'key' en la lista.
    setShopData((prev) => ({
      ...prev,
      social_media: [
        ...prev.social_media,
        { id: `new_${Date.now()}`, name: "", url: "" },
      ],
    }));
    setTimeout(() => {
      socialMediaScrollRef.current?.scrollToEnd({ animated: true });
    }, 100); // Pequeño delay para asegurar que el nuevo item se renderice
  };

  const removeSocialMedia = (index) => {
    const newSocialMedia = [...shopData.social_media];
    newSocialMedia.splice(index, 1);
    setShopData((prev) => ({ ...prev, social_media: newSocialMedia }));
  };

  const handleDayPress = (day) => {
    const date = day.dateString;
    const newBlockedDates = [...(shopData.blocked_dates || [])];
    const index = newBlockedDates.indexOf(date);

    if (index > -1) {
      newBlockedDates.splice(index, 1);
    } else {
      newBlockedDates.push(date);
    }
    setShopData((prev) => ({ ...prev, blocked_dates: newBlockedDates }));
  };

  const getMarkedDates = () => {
    const marked = {};
    if (shopData.blocked_dates) {
      shopData.blocked_dates.forEach((date) => {
        marked[date] = { selected: true, selectedColor: palette.secondary };
      });
    }
    return marked;
  };

  const handleImagePick = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se necesita acceso a la galería para subir una imagen."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      setUploading(true);
      try {
        const filePath = `logos/shop_logo_${Date.now()}.webp`;
        const { data, error } = await supabase.storage
          .from("avatars")
          .upload(filePath, decode(image.base64), {
            contentType: "image/webp",
            upsert: true,
          });

        if (error) {
          throw error;
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(data.path);

        handleInputChange("logo_url", publicUrlData.publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert("Error", "No se pudo subir la imagen.");
      } finally {
        setUploading(false);
      }
    }
  };

  const showTimePicker = (day, mode) => {
    setSelectedDay(day);
    setTimePickerMode(mode);
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisible(false);
  };

  const onTimeChange = (event, selectedTime) => {
    hideTimePicker();
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const time = `${hours}:${minutes}`;
      handleWorkingHoursChange(selectedDay, timePickerMode, time);
    }
  };

  if (loading || !shopData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="store-edit-outline"
            size={24}
            color={palette.primary}
          />
          <Text style={styles.title}>Mi Barbería</Text>
        </View>
      </View>
      <ScrollView>
        <View style={styles.form}>
          <ShopInfoCard
            shopData={shopData}
            onInputChange={handleInputChange}
            onImagePick={handleImagePick}
            uploading={uploading}
          />

          <WelcomeMessageCard
            welcome_message={shopData.welcome_message}
            onInputChange={handleInputChange}
          />

          <Text style={styles.sectionTitle}>Redes Sociales</Text>
          <View style={styles.socialMediaListContainer}>
            <ScrollView
              ref={socialMediaScrollRef}
              nestedScrollEnabled={true}
              onContentSizeChange={() =>
                socialMediaScrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {/* Se usa social.id como key para una identificación estable y única */}
              {shopData.social_media.map((social, index) => (
                <SocialMediaCard
                  key={social.id || `social-${index}`}
                  social={social}
                  index={index}
                  onSocialMediaChange={handleSocialMediaChange}
                  onRemoveSocialMedia={removeSocialMedia}
                />
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity
            onPress={addSocialMedia}
            style={styles.addButtonOutline}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={palette.primary}
            />
            <Text style={styles.addButtonOutlineText}>Añadir Red Social</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Horarios de Trabajo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(daysOfWeek).map(([dayKey, dayName]) => (
              <DayWorkingHoursCard
                key={dayKey}
                dayKey={dayKey}
                dayName={dayName}
                dayData={shopData.working_hours[dayKey]}
                onToggle={(value) =>
                  handleWorkingHoursChange(dayKey, "enabled", value)
                }
                onTimePress={(mode) => showTimePicker(dayKey, mode)}
              />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Fechas No Laborables</Text>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType={"multi-dot"}
            theme={{
              selectedDayBackgroundColor: palette.primary,
              arrowColor: palette.primary,
              todayTextColor: palette.primary,
            }}
          />
        </View>
      </ScrollView>

      {isTimePickerVisible && (
        <DateTimePicker
          value={new Date()}
          mode={"time"}
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ShopInfoCard = ({ shopData, onInputChange, onImagePick, uploading }) => {
  return (
    <Card style={styles.shopInfoCard}>
      <Card.Content style={styles.shopInfoCardContent}>
        <TouchableOpacity
          onPress={onImagePick}
          disabled={uploading}
          style={styles.logoContainer}
        >
          <Image
            source={{
              uri: shopData.logo_url || "https://via.placeholder.com/100",
            }}
            style={styles.logo}
          />
          <View style={styles.editIconOverlay}>
            <MaterialCommunityIcons name="pencil" size={18} color="white" />
          </View>
          {uploading && <ActivityIndicator style={styles.logoLoading} />}
        </TouchableOpacity>
        <View style={styles.shopInfoTextContainer}>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.shopNameInput}
              value={shopData.name}
              onChangeText={(text) => onInputChange("name", text)}
            />
            <MaterialCommunityIcons
              name="pencil"
              size={16}
              color={palette.gray}
            />
          </View>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.shopAddressInput}
              value={shopData.address}
              onChangeText={(text) => onInputChange("address", text)}
            />
            <MaterialCommunityIcons
              name="pencil"
              size={16}
              color={palette.gray}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const WelcomeMessageCard = ({ welcome_message, onInputChange }) => {
  return (
    <View style={styles.welcomeMessageCard}>
      <Text style={styles.sectionTitle}>Mensaje de Bienvenida</Text>
      <View style={styles.welcomeMessageInputContainer}>
        <TextInput
          style={styles.welcomeMessageInput}
          value={welcome_message}
          onChangeText={(text) => onInputChange("welcome_message", text)}
          multiline
          placeholder="Toca para editar el mensaje que verán tus clientes..."
          placeholderTextColor={palette.darkGray}
        />
        <MaterialCommunityIcons
          name="pencil"
          size={16}
          color={palette.gray}
          style={styles.welcomeMessageEditIcon}
        />
      </View>
    </View>
  );
};

const DayWorkingHoursCard = ({
  dayKey,
  dayName,
  dayData,
  onToggle,
  onTimePress,
}) => {
  const isEnabled = dayData?.enabled || false;
  return (
    <View
      style={[
        styles.card,
        isEnabled ? styles.cardEnabled : styles.cardDisabled,
      ]}
    >
      <MaterialCommunityIcons
        name="calendar-clock"
        size={40}
        color={isEnabled ? palette.primary : palette.secondary}
      />
      <View style={{ alignItems: "center", marginVertical: 5 }}>
        <Text
          style={[styles.dayCardTitle, !isEnabled && { color: palette.gray }]}
        >
          {dayName}
        </Text>
        <Switch
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          value={isEnabled}
          onValueChange={onToggle}
          trackColor={{ false: palette.secondary, true: palette.primary }}
          thumbColor={isEnabled ? palette.white : "#f4f3f4"}
        />
      </View>
      {isEnabled && (
        <View style={styles.dayCardContent}>
          <TouchableOpacity onPress={() => onTimePress("open")}>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxTitle}>Apertura</Text>
              <Text style={styles.timeText}>{dayData?.open || "--:--"}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onTimePress("close")}>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxTitle}>Cierre</Text>
              <Text style={styles.timeText}>{dayData?.close || "--:--"}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const SocialMediaCard = ({
  social,
  index,
  onSocialMediaChange,
  onRemoveSocialMedia,
}) => {
  const getSocialIcon = (name) => {
    const lowerCaseName = (name || "").toLowerCase();
    const lowerCaseUrl = (social.url || "").toLowerCase();

    if (
      lowerCaseName.includes("instagram") ||
      lowerCaseUrl.includes("instagram.com")
    )
      return "instagram";
    if (
      lowerCaseName.includes("facebook") ||
      lowerCaseUrl.includes("facebook.com")
    )
      return "facebook";
    if (
      lowerCaseName.includes("twitter") ||
      lowerCaseUrl.includes("twitter.com") ||
      lowerCaseUrl.includes("x.com")
    )
      return "twitter";
    if (lowerCaseName.includes("tiktok") || lowerCaseUrl.includes("tiktok.com"))
      return "tiktok";
    return "link-variant"; // Un ícono más genérico para enlaces
  };

  return (
    <Card style={styles.socialCard}>
      <Card.Content>
        <View style={styles.socialCardHeader}>
          <MaterialCommunityIcons
            name={getSocialIcon(social.name)}
            size={24}
            color={palette.darkGray}
          />
          <TextInput
            style={styles.socialInputName}
            placeholder="Nombre (e.g., Instagram)"
            value={social.name}
            onChangeText={(text) => onSocialMediaChange(index, "name", text)}
          />
          <IconButton
            icon="delete"
            iconColor={palette.secondary}
            size={20}
            onPress={() => onRemoveSocialMedia(index)}
          />
        </View>
        <TextInput
          style={styles.socialInputUrl}
          placeholder="URL"
          value={social.url}
          onChangeText={(text) => onSocialMediaChange(index, "url", text)}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: palette.white,
    borderBottomWidth: 4,
    borderBottomColor: palette.secondary,
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
    color: palette.text,
  },
  form: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
    color: palette.darkGray,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.gray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: palette.white,
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
  },
  logoContainer: {
    position: "relative",
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 15,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  logoLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray,
    paddingBottom: 5,
  },
  saveButtonContainer: {
    padding: 10,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.gray,
  },
  saveButton: {
    backgroundColor: palette.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: palette.gray,
  },
  saveButtonText: {
    color: palette.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  shopInfoCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: palette.white,
    borderColor: palette.gray,
    borderWidth: 1,
  },
  shopInfoCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopInfoTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  shopNameInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    paddingBottom: 5,
    color: palette.text,
  },
  shopAddressInput: {
    flex: 1,
    fontSize: 14,
    color: palette.darkGray,
    marginTop: 5,
  },
  welcomeMessageContainer: {
    // Estilo no utilizado
  },
  welcomeMessageCard: {
    marginBottom: 20,
  },
  welcomeMessageInputContainer: {
    position: "relative",
    backgroundColor: palette.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderColor: palette.gray,
    borderWidth: 1,
  },
  welcomeMessageEditIcon: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  welcomeMessageInput: {
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
    padding: 16,
    paddingRight: 40, // Espacio para el ícono
    color: palette.text,
  },
  card: {
    width: 160,
    height: 180,
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 10,
  },
  dayCard: {
    // Reemplazado por 'card' para el carrusel
  },
  cardEnabled: {
    backgroundColor: palette.white,
  },
  cardDisabled: {
    backgroundColor: palette.lightGray,
  },
  dayCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: palette.text,
  },
  dayCardContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  timeBox: {
    alignItems: "center",
  },
  timeBoxTitle: {
    fontSize: 12,
    color: palette.darkGray,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: palette.primary,
  },
  socialCard: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: palette.white,
    borderColor: palette.gray,
    borderWidth: 1,
  },
  socialCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  socialInputName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
    color: palette.primary,
    flex: 1,
  },
  socialInputUrl: {
    color: palette.text,
    backgroundColor: palette.lightGray,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  workingHoursListContainer: {},
  socialMediaListContainer: {
    height: 300, // Altura aumentada para la lista de redes sociales
    borderWidth: 1,
    borderColor: palette.gray,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  addButtonOutline: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.primary,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 10,
  },
  addButtonOutlineText: {
    color: palette.primary,
    fontWeight: "bold",
  },
});
