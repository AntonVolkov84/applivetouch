import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TextInput, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { UserAuthData } from "../types";
import { api } from "../axiosInstance";
import Button from "../components/Button";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [user, setUser] = useState<UserAuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err: any) {
      console.error("Ошибка при получении данных:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    navigation.replace("Login");
  };
  const handleSearch = () => {
    console.log("Поиск:", searchQuery);
    setSearchQuery("");
  };
  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  const cleanInput = (text: string) => {
    return text.replace(/<\/?[^>]+(>|$)/g, "");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileCircle} onTouchEnd={() => navigation.navigate("Profile")}>
          <Text style={styles.profileInitial}>{user?.username?.[0]?.toUpperCase() || "U"}</Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(cleanInput(text))}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <Text style={styles.searchIcon} onPress={handleSearch}>
            🔍
          </Text>
        </View>
      </View>
      {user ? (
        <>
          <Text style={styles.welcome}>
            Добро пожаловать в <Text style={{ color: "#007bff" }}>LiveTouch</Text>, {user.username || user.email} 👋
          </Text>
        </>
      ) : (
        <Text>Нет данных пользователя</Text>
      )}

      <Button title="Выйти" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 100, paddingHorizontal: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcome: { fontSize: 22, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  info: { fontSize: 16, color: "#555", marginBottom: 30 },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: "absolute",
    top: 40,
  },

  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },

  profileInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  searchIcon: {
    fontSize: 26,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#f1f1f1",
    marginLeft: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 48,
  },

  searchInput: {
    flex: 1,
    fontSize: 20,
    color: "#000",
    paddingVertical: 4,
  },
});
