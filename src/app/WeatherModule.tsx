import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const API_KEY = "56bfa61d4025725a964463d4557416e5";
const CACHE_KEY = "@last_searched_weather";

interface WeatherData {
  city: string;
  temp: number;
  status: string;
  icon: string;
}

export default function WeatherModule() {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(
    null,
  );
  const [loadingCurrent, setLoadingCurrent] = useState<boolean>(true);

  const [city, setCity] = useState<string>("");
  const [searchedWeather, setSearchedWeather] = useState<WeatherData | null>(
    null,
  );
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const formatWeather = (data: any): WeatherData => ({
    city: data.name,
    temp: Math.round(data.main.temp),
    status: data.weather[0].description,
    icon: data.weather[0].icon,
  });

  const fetchCurrentLocationWeather = async () => {
    try {
      let url = `https://api.openweathermap.org/data/2.5/weather?q=Baku&appid=${API_KEY}&units=metric&lang=az`;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&appid=${API_KEY}&units=metric&lang=az`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setCurrentWeather(formatWeather(data));
      }
    } catch {
      const saved = await AsyncStorage.getItem(CACHE_KEY);
      if (saved) {
        setSearchedWeather(JSON.parse(saved));
        setIsOffline(true);
      }
    } finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocationWeather();
  }, []);

  const handleSearch = async () => {
    if (!city.trim()) return;

    setLoadingSearch(true);
    setError("");

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${API_KEY}&units=metric&lang=az`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 404) {
        setError("Şəhər tapılmadı.");
        setIsOffline(false);
        return;
      }

      if (!res.ok) throw new Error("Xəta");

      const result = formatWeather(data);
      setSearchedWeather(result);
      setIsOffline(false);
      setCity("");

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {
      const saved = await AsyncStorage.getItem(CACHE_KEY);
      if (saved) {
        setSearchedWeather(JSON.parse(saved));
        setIsOffline(true);
      } else {
        setError("İnternet yoxdur və yaddaşda məlumat tapılmadı.");
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Olduğum yer</Text>
      {loadingCurrent ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : currentWeather ? (
        <View style={[styles.card, styles.currentCard]}>
          <View>
            <Text style={styles.city}>{currentWeather.city}</Text>
            <Text style={styles.status}>{currentWeather.status}</Text>
          </View>
          <View style={styles.row}>
            <Image
              style={styles.icon}
              source={{
                uri: `https://openweathermap.org/img/wn/${currentWeather.icon}@2x.png`,
              }}
            />
            <Text style={styles.temp}>{currentWeather.temp}°C</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.muted}>Cari məkan məlumatı alınmadı</Text>
      )}

      <Text style={[styles.label, { marginTop: 14 }]}>Şəhər axtar</Text>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Şəhər adı daxil edin..."
          value={city}
          onChangeText={setCity}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.btn} onPress={handleSearch}>
          <Text style={styles.btnText}>Axtar</Text>
        </TouchableOpacity>
      </View>

      {isOffline && (
        <Text style={styles.offline}>
          İnternet yoxdur — son axtarılan nəticə göstərilir
        </Text>
      )}

      {loadingSearch ? (
        <ActivityIndicator
          size="small"
          color="#007AFF"
          style={{ marginTop: 8 }}
        />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        searchedWeather && (
          <View style={styles.card}>
            <View>
              <Text style={styles.city}>{searchedWeather.city}</Text>
              <Text style={styles.status}>{searchedWeather.status}</Text>
            </View>
            <View style={styles.row}>
              <Image
                style={styles.icon}
                source={{
                  uri: `https://openweathermap.org/img/wn/${searchedWeather.icon}@2x.png`,
                }}
              />
              <Text style={styles.temp}>{searchedWeather.temp}°C</Text>
            </View>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  currentCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  city: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  status: {
    fontSize: 13,
    color: "#475569",
    textTransform: "capitalize",
  },
  icon: {
    width: 46,
    height: 46,
  },
  temp: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007AFF",
  },
  searchBox: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  btn: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnText: {
    color: "#FFF",
    fontWeight: "600",
  },
  offline: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontSize: 12,
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
    textAlign: "center",
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  muted: {
    color: "#94A3B8",
    fontSize: 13,
  },
});
