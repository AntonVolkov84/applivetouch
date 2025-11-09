import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Button from "../components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { UserAuthData } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [user, setUser] = useState<UserAuthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        navigation.replace("Login");
        return;
      }
      const res = await axios.get("https://api.livetouch.chat/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err: any) {
      console.log("Ошибка при получении данных:", err.response?.data || err.message);
      Alert.alert("Ошибка", "Не удалось получить данные пользователя. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("accessToken");
    navigation.replace("Login");
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      {user ? (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" }}>
            Добро пожаловать в LiveTouch, {user.username || user.email} 👋!
          </Text>
          <Text style={{ fontSize: 16, color: "#555", marginBottom: 30 }}>Ваш ID: {user.id}</Text>
        </>
      ) : (
        <Text>Нет данных пользователя</Text>
      )}
      <Button title="Выйти" onPress={handleLogout} />
    </View>
  );
}
