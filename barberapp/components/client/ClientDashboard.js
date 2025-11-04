import React from "react";
import {
  ScrollView,
  StyleSheet,
  Platform,
  UIManager,
  View,
} from "react-native";
import Header from "./Header";
import ReserveButton from "./ReserveButton";
import WorkingHours from "./WorkingHours";
import Barbers from "./Barbers";
import Services from "./Services";
import SocialMedia from "./SocialMedia";

export default function ClientDashboard({ shopSettings, barbers, services }) {
  return (
    <ScrollView style={styles.background} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Header shopSettings={shopSettings} />
        <ReserveButton />
        <WorkingHours shopSettings={shopSettings} />
        <Barbers barbers={barbers} />
        <Services services={services} />
        <SocialMedia socialMedia={shopSettings?.social_media} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, paddingTop: 50, backgroundColor: "#f3f4f6" },
  container: { alignItems: "center", paddingBottom: 50 },
});
