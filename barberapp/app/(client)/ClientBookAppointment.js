import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSessionStore } from "../../store/sessionStore";
import api from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { LocaleConfig } from "react-native-calendars";
import { DateTime } from "luxon";

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene.",
    "Feb.",
    "Mar.",
    "Abr.",
    "May.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dic.",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom.", "Lun.", "Mar.", "Mié.", "Jue.", "Vie.", "Sáb."],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

const SLOT_INTERVAL = 30; // minutes
const dayMap = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function BookAppointmentScreen() {
  const { session, profile } = useSessionStore();
  const router = useRouter();

  const resetBookingState = () => {
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(new Date());
    setSelectedSlot(null);
    setTimeSlots([]);
    setCurrentStep(1);
    setIsCalendarVisible(true);
  };

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [shopSettings, setShopSettings] = useState({ blocked_dates: [] });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(1); // 1: Service, 2: Barber, 3: Date/Time
  const [isCalendarVisible, setIsCalendarVisible] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (session) {
        resetBookingState();
        fetchData();
      }
    }, [session])
  );

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      setIsCalendarVisible(true);
    }
  }, [currentStep]);

  const fetchData = async () => {
    if (!session) return;
    setLoading(true);
    console.log("📲 [FRONTEND] Iniciando fetchData...");
    try {
      console.log(
        "📲 [FRONTEND] Realizando llamadas a /api/services, /api/public/barbers, /api/public/shop-info"
      );
      const [servicesRes, barbersRes, shopRes] = await Promise.all([
        api.get("/api/services"), // Public endpoint for all services
        api.get("/api/public/barbers"), // Public endpoint for barbers
        api.get("/api/public/shop-info"), // Public endpoint for shop info
      ]);

      console.log("✅ [FRONTEND] Datos recibidos correctamente.");
      setServices(servicesRes.data);
      setBarbers(barbersRes.data);
      // The shop-info endpoint returns the data object directly
      setShopSettings(shopRes.data || { blocked_dates: [] });
    } catch (error) {
      const errorMessage = error.response
        ? JSON.stringify(error.response.data)
        : error.message;
      console.error("❌ [FRONTEND] Error en fetchData:", errorMessage);
      Alert.alert(
        "Error de Red",
        `No se pudieron cargar los datos para la reserva. Detalles: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  const isDateBlocked = (date) => {
    if (!date) return true;
    const dateString = date.toISOString().split("T")[0];
    // Comprueba tanto las fechas bloqueadas generales como las específicas del barbero.
    const generalBlocked = shopSettings.blocked_dates?.includes(dateString);
    const barberBlocked =
      selectedBarber?.extra_data?.blocked_dates?.includes(dateString);

    return generalBlocked || barberBlocked;
  };

  const fetchAvailableSlots = async () => {
    if (!selectedBarber || !selectedDate || !selectedService) return;
    setTimeSlots([]); // Clear previous slots
    setSlotsLoading(true);

    const dateString = DateTime.fromJSDate(selectedDate).toISODate();
    if (isDateBlocked(selectedDate)) {
      setSlotsLoading(false);
      return;
    }
    try {
      const response = await api.get(
        `/api/public/barbers/${selectedBarber.id}/available-slots`,
        { params: { date: dateString, serviceId: selectedService.id } }
      );
      setTimeSlots(response.data);
    } catch (error) {
      Alert.alert(
        "Error",
        `No se pudo obtener los horarios disponibles. ${
          error.response?.data?.message || ""
        }`
      );
      console.error("Error fetching slots:", error.response?.data || error);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedBarber, selectedDate, selectedService]);

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedBarber || !selectedSlot) {
      Alert.alert("Error", "Por favor, completa todos los pasos.");
      return;
    }

    setBooking(true);
    try {
      const appointmentDate = DateTime.fromJSDate(selectedDate).toISODate();
      const startTime = selectedSlot;
      const startDateTime = DateTime.fromISO(`${appointmentDate}T${startTime}`);
      const endTime = startDateTime
        .plus({ minutes: selectedService.duration_minutes })
        .toFormat("HH:mm:ss");

      const bookingData = {
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
      };
      console.log("[Booking] 📦 Enviando datos de reserva:", bookingData);

      await api.post("/api/appointments", {
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
      });

      Alert.alert("¡Éxito!", "Tu cita ha sido reservada correctamente.", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/ClientMyAppointments");
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo reservar la cita."
      );
    } finally {
      setBooking(false);
    }
  };

  const filteredBarbers = selectedService // Si hay un servicio seleccionado...
    ? barbers.filter((b) => b.extra_data?.offered_services?.includes(selectedService.id)) // ...filtramos los barberos que lo ofrecen.
    : barbers; // Si no, mostramos todos los barberos.

  const getMarkedDates = () => {
    const marked = {};
    shopSettings.blocked_dates.forEach((date) => {
      marked[date] = { disabled: true, disableTouchEvent: true };
    });

    if (selectedBarber?.extra_data?.availability) {
      // Add barber-specific blocked dates
      if (selectedBarber.extra_data.blocked_dates) {
        selectedBarber.extra_data.blocked_dates.forEach((date) => {
          marked[date] = { disabled: true, disableTouchEvent: true };
        });
      }

      // Disable days the barber doesn't work
      const availability = selectedBarber.extra_data.availability;
      const today = DateTime.now().startOf("day");
      for (let i = 0; i < 365; i++) {
        const futureDate = today.plus({ days: i });
        const dayIndex = futureDate.weekday % 7;
        const dayName = dayMap[dayIndex];
        const dateString = futureDate.toISODate();
        if (!availability[dayName] || !availability[dayName].enabled) {
          marked[dateString] = {
            ...(marked[dateString] || {}),
            disabled: true,
            disableTouchEvent: true,
          };
        }
      }
    }

    const selectedDateString = selectedDate.toISOString().split("T")[0];
    marked[selectedDateString] = {
      ...(marked[selectedDateString] || {}),
      selected: true,
      selectedColor: "#3B82F6",
    };
    return marked;
  };

  if (loading) {
    return (
      <View style={styles.fullScreenCenter}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Preparando la agenda...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="add-circle-outline" size={28} color="#1e293b" />
          <Text style={styles.headerTitle}>Reservar Turno</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ paddingTop: 24 }}>


        {/* --- Step 1: Select Service --- */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepHeaderText}>Paso 1: Elige un Servicio</Text>
            </View>
            <View>
              {services.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (item.id !== selectedService?.id) {
                      setSelectedService(item);
                      setSelectedBarber(null);
                      setSelectedSlot(null);
                    }
                  }}
                  style={[
                    styles.serviceCard,
                    selectedService?.id === item.id && styles.selectedCard,
                  ]}
                >
                  <BlurView
                    intensity={60}
                    tint="light"
                    style={styles.serviceInnerBlur}
                  >
                    <Ionicons
                      name="cut-outline"
                      size={32}
                      color="#0052cc"
                      style={styles.serviceIcon}
                    />
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceName}>{item.name}</Text>
                      <View style={styles.serviceMetaContainer}>
                        <Text style={styles.serviceMeta}>
                          <Ionicons name="time-outline" size={14} />{" "}
                          {item.duration_minutes} min
                        </Text>
                        <Text style={styles.serviceMeta}>
                          <Ionicons name="cash-outline" size={14} /> $
                          {item.price}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward-outline"
                      size={24}
                      color="#e63946"
                    />
                  </BlurView>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* --- Step 2: Select Barber --- */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepHeaderText}>Paso 2: Elige un Barbero</Text>
            </View>
            <FlatList
              horizontal
              data={filteredBarbers}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if (item.id !== selectedBarber?.id) {
                      setSelectedBarber(item);
                      setSelectedSlot(null);
                    }
                  }}
                  style={[
                    styles.choiceCard,
                    selectedBarber?.id === item.id && styles.selectedCard,
                  ]}
                >
                  <BlurView
                    intensity={50}
                    tint="light"
                    style={styles.innerBlur}
                  >
                    <Image
                      source={{
                        uri:
                          item.avatar_url ||
                          `https://ui-avatars.com/api/?background=e63946&color=fff&name=${item.full_name}`,
                      }}
                      style={styles.barberAvatar}
                    />
                    <Text style={styles.barberName}>{item.full_name}</Text>
                  </BlurView>
                </Pressable>
              )}
              ListEmptyComponent={
                <BlurView
                  intensity={50}
                  tint="light"
                  style={styles.emptyListContainer}
                >
                  <Ionicons name="sad-outline" size={32} color="#e63946" />
                  <Text style={styles.emptyListText}>
                    No hay barberos para este servicio.
                  </Text>
                </BlurView>
              }
            />
          </View>
        )}

        {/* --- Step 3: Select Date & Time --- */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepHeaderText}>Paso 3: Elige Fecha y Hora</Text>
            </View>
            {isCalendarVisible ? (
              <BlurView
                intensity={50}
                tint="light"
                style={styles.calendarSection}
              >
                <Calendar
                  onDayPress={(day) => {
                    const newDate = new Date(day.dateString + "T00:00:00");
                    if (newDate.getTime() !== selectedDate.getTime()) {
                      setSelectedDate(newDate);
                      setSelectedSlot(null);
                    }
                    setIsCalendarVisible(false);
                  }}
                  markedDates={getMarkedDates()}
                  minDate={new Date().toISOString().split("T")[0]}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: "#b6c1cd",
                    selectedDayBackgroundColor: "#3B82F6",
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: "#e63946",
                    dayTextColor: "#2d4150",
                    arrowColor: "#e63946",
                    monthTextColor: "#2d4150",
                    textMonthFontWeight: "bold",
                    textDayHeaderFontWeight: "bold",
                  }}
                />
              </BlurView>
            ) : (
              <View>
                <Pressable
                  onPress={() => setIsCalendarVisible(true)}
                  style={styles.changeDateButton}
                >
                  <Text style={styles.changeDateButtonText}>Cambiar Fecha</Text>
                </Pressable>
                {timeSlots.length > 0 ? (
                  <View style={styles.slotsContainer}>
                    <View style={styles.slotsHeader}>
                      <Text style={styles.slotsTitle}>
                        Horarios Disponibles
                      </Text>
                      <View style={styles.refreshButtonContainer}>
                        {slotsLoading ? (
                          <ActivityIndicator size="small" color="#3B82F6" />
                        ) : (
                          <Pressable
                            // Botón de recarga con indicador de carga
                            onPress={fetchAvailableSlots}
                            style={styles.refreshSlotsButton}
                          >
                            <Ionicons name="refresh" size={22} color="#3B82F6" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                    <Text style={styles.currentTimeText}>
                      Hora actual:{" "}
                      {DateTime.fromJSDate(currentTime).toFormat("HH:mm")}
                    </Text>
                    <View style={styles.slotsGrid}>
                      {timeSlots.map((slot) => {
                        const isSelected = selectedSlot === slot.time;
                        const startTime = DateTime.fromISO(
                          `${DateTime.fromJSDate(
                            selectedDate
                          ).toISODate()}T${slot.time}`
                        );
                        const isPast = startTime < DateTime.now();
                        const isBooked = slot.status === "booked";
                        const isDisabled = isPast || isBooked;
                        const endTime = startTime.plus({
                          minutes: selectedService.duration_minutes,
                        });
                        return (
                          <Pressable
                            key={slot.time}
                            onPress={() => !isDisabled && setSelectedSlot(slot.time)}
                            disabled={isDisabled}
                            style={[
                              styles.slotButton,
                              isDisabled && styles.slotButtonPast,
                              isSelected && styles.slotButtonSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.slotText,
                                isDisabled && styles.slotTextPast,
                                isSelected && styles.slotButtonSelectedText,
                              ]}
                            >
                              {startTime.toFormat("HH:mm")} -{" "}
                              {endTime.toFormat("HH:mm")}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  // Muestra el loader si está cargando, si no, el mensaje de que no hay horarios.
                  slotsLoading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#3B82F6" />
                  ) : (
                    <View style={styles.emptyListContainer}>
                      <Ionicons name="time-outline" size={32} color="#9CA3AF" />
                      <Text style={styles.emptyListText}>No hay horarios disponibles para este día.</Text>
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <Pressable
            onPress={() => setCurrentStep(currentStep - 1)}
            style={[styles.footerButton, styles.backButton]}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#1e293b" />
            <Text
              style={[
                styles.footerButtonText,
                { color: "#1e293b", marginLeft: 8 },
              ]}
            >
              Atrás
            </Text>
          </Pressable>
        )}
        {currentStep < 3 ? (
          <Pressable
            onPress={() => setCurrentStep(currentStep + 1)}
            style={[
              styles.footerButton,
              styles.continueButton,
              ((currentStep === 1 && !selectedService) ||
                (currentStep === 2 && !selectedBarber)) &&
                styles.disabledButton,
            ]}
            disabled={
              (currentStep === 1 && !selectedService) ||
              (currentStep === 2 && !selectedBarber)
            }
          >
            <Text
              style={[
                styles.footerButtonText,
                { color: "white", marginRight: 8 },
              ]}
            >
              Continuar
            </Text>
            <Ionicons name="arrow-forward-outline" size={20} color="white" />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleBookAppointment}
            style={[
              styles.footerButton,
              styles.bookButton,
              (booking || !selectedSlot) && styles.disabledButton,
            ]}
            disabled={booking || !selectedSlot}
          >
            {booking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.footerButtonText, { color: "white" }]}>
                Confirmar Turno
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fullScreenCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  loadingText: {
    marginTop: 8,
    color: "#475569",
  },
  header: {
    paddingTop: 60, // Increased padding to avoid status bar
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "white",
    borderBottomWidth: 3,
    borderBottomColor: "#e63946",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 10,
  },
  stepHeader: {
    backgroundColor: "#0052cc", // Cambiado a azul primario
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  stepHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  stepContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: "#1e293b",
    overflow: "hidden", // Para contener el fondo animado
    borderWidth: 2,
    borderColor: "#000",
  },
  barberPoleBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    opacity: 0.4,
  },
  stripe: {
    width: 20,
    height: "300%",
    top: "-100%",
    transform: [{ skewX: "-45deg" }],
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginLeft: 12,
    textShadowColor: "black",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  choiceCard: {
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#0052cc",
    overflow: "hidden",
  },
  // --- Nuevos Estilos para la Lista de Servicios ---
  serviceCard: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#0052cc",
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  serviceInnerBlur: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  serviceIcon: {
    marginRight: 16,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  serviceMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceMeta: {
    fontSize: 14,
    color: "#e63946",
    fontWeight: "600",
    marginRight: 16,
  },
  selectedCard: {
    borderColor: "#e63946",
    borderWidth: 3,
  },
  // --- Fin de Nuevos Estilos ---
  innerBlur: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  choiceCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  choiceCardSubtitle: {
    fontSize: 14,
    color: "#e63946",
    fontWeight: "600",
    marginTop: 4,
  },
  barberAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#0052cc",
    marginBottom: 8,
  },
  barberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e63946",
    textAlign: "center",
  },
  emptyListContainer: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#457b9d",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    width: "100%",
  },
  emptyListText: {
    color: "#1e293b",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  calendarSection: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#0052cc",
    overflow: "hidden",
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  slotsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 82, 204, 0.2)",
  },
  slotsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  refreshButtonContainer: {
    width: 30, // Ancho fijo para evitar que el layout salte
    alignItems: "center",
    paddingHorizontal: 8,
  },
  slotsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  refreshSlotsButton: {
    padding: 4,
  },
  currentTimeText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 4,
  },
  slotButton: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: "#457b9d",
  },
  slotButtonPast: {
    backgroundColor: "#e5e7eb",
    borderColor: "#d1d5db",
  },
  slotButtonSelected: {
    backgroundColor: "#0052cc",
    borderColor: "#a12831",
  },
  slotText: {
    fontWeight: "600",
    color: "#0052cc",
  },
  slotTextPast: {
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  slotButtonSelectedText: {
    color: "white",
  },
  changeDateButton: {
    backgroundColor: "#e2e8f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  changeDateButtonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1e293b",
  },
  backButton: {
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },
  bookButton: {
    backgroundColor: "#16a34a",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24, // Padding horizontal para el contenido
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  footerButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: "#3b82f6",
    marginLeft: 8,
  },
});
