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
  primary: "#007BFF",
  secondary: "#dc3545",
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
    setShopData((prev) => ({
      ...prev,
      social_media: [...prev.social_media, { name: "", url: "" }],
    }));
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la galería para subir una imagen.");
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
          <MaterialCommunityIcons name="store-edit-outline" size={24} color={palette.primary} />
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
          {shopData.social_media.map((social, index) => (
            <SocialMediaCard
              key={index}
              social={social}
              index={index}
              onSocialMediaChange={handleSocialMediaChange}
              onRemoveSocialMedia={removeSocialMedia}
            />
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addSocialMedia}>
            <Text style={styles.addButtonText}>Añadir Red Social</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Horarios de Trabajo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(daysOfWeek).map(([dayKey, dayName]) => (
              <DayWorkingHoursCard
                key={dayKey}
                dayKey={dayKey}
                dayName={dayName}
                dayData={shopData.working_hours[dayKey]}
                onToggle={(value) => handleWorkingHoursChange(dayKey, "enabled", value)}
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
        <Button
          title={isSaving ? "Guardando..." : "Guardar Cambios"}
          onPress={handleSave}
          disabled={isSaving}
          color={palette.primary}
        />
      </View>
    </View>
  );
}

const ShopInfoCard = ({ shopData, onInputChange, onImagePick, uploading }) => {
  return (
    <Card style={styles.shopInfoCard}>
      <Card.Content style={styles.shopInfoCardContent}>
        <TouchableOpacity onPress={onImagePick} disabled={uploading}>
          <Image
            source={{ uri: shopData.logo_url || "https://via.placeholder.com/100" }}
            style={styles.logo}
          />
          {uploading && <ActivityIndicator style={styles.logoLoading} />}
        </TouchableOpacity>
        <View style={styles.shopInfoTextContainer}>
          <TextInput
            style={styles.shopNameInput}
            value={shopData.name}
            onChangeText={(text) => onInputChange("name", text)}
          />
          <TextInput
            style={styles.shopAddressInput}
            value={shopData.address}
            onChangeText={(text) => onInputChange("address", text)}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const WelcomeMessageCard = ({ welcome_message, onInputChange }) => {
  return (
    <Card style={styles.welcomeCard}>
      <Card.Title 
        title="Mensaje de Bienvenida"
        left={(props) => <MaterialCommunityIcons {...props} name="message-outline" size={24} color={palette.darkGray} />} 
      />
      <Card.Content>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={welcome_message}
          onChangeText={(text) => onInputChange("welcome_message", text)}
          multiline
        />
      </Card.Content>
    </Card>
  );
};

const DayWorkingHoursCard = ({ dayKey, dayName, dayData, onToggle, onTimePress }) => {
  const isEnabled = dayData?.enabled || false;
  return (
    <View style={[styles.card, isEnabled ? styles.cardEnabled : styles.cardDisabled]}>
      <MaterialCommunityIcons name="calendar-clock" size={40} color={isEnabled ? palette.primary : palette.gray} />
      <View style={{alignItems: 'center', marginVertical: 5}}>
        <Text style={[styles.dayCardTitle, !isEnabled && { color: palette.gray }]}>{dayName}</Text>
        <Switch style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }]}} value={isEnabled} onValueChange={onToggle} trackColor={{ false: "#767577", true: palette.primary }} thumbColor={isEnabled ? palette.white : "#f4f3f4"}/>
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

const SocialMediaCard = ({ social, index, onSocialMediaChange, onRemoveSocialMedia }) => {
  const getSocialIcon = (name) => {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes("instagram")) return "instagram";
    if (lowerCaseName.includes("facebook")) return "facebook";
    if (lowerCaseName.includes("twitter")) return "twitter";
    if (lowerCaseName.includes("tiktok")) return "tiktok";
    return "web";
  };

  return (
    <Card style={styles.socialCard}>
      <Card.Content>
        <View style={styles.socialCardHeader}>
          <MaterialCommunityIcons name={getSocialIcon(social.name)} size={24} color={palette.darkGray} />
          <TextInput
            style={styles.socialInputName}
            placeholder="Nombre (e.g., Instagram)"
            value={social.name}
            onChangeText={(text) => onSocialMediaChange(index, "name", text)}
          />
          <IconButton
            icon="delete"
            color={palette.secondary}
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
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  addButton: {
    backgroundColor: palette.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: palette.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButtonContainer: {
    padding: 10,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.gray,
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
    fontSize: 20,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 5,
    color: palette.text,
  },
  shopAddressInput: {
    fontSize: 14,
    color: palette.darkGray,
    marginTop: 5,
  },
  welcomeCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: palette.white,
    borderColor: palette.gray,
    borderWidth: 1,
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
    color: palette.darkGray
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
    color: palette.text,
  },
  socialInputUrl: {
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 10,
    marginTop: 10,
    color: palette.text,
  },
});
