import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import WeatherModule from "../app/WeatherModule";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <WeatherModule />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}
