import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { api } from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserAuthData } from "../types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import Button from "../components/Button";
import * as ImagePicker from "expo-image-picker";
import { useAlert } from "../context/AppContext";
import axios from "axios";
import { File } from "expo-file-system";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<UserAuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [surname, setSurname] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const alert = useAlert();

  const sanitizeInput = (text: string) => {
    return text
      .replace(/<[^>]*>?/gm, "")
      .replace(/script/gi, "")
      .trim();
  };
  const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      setUsername(res.data.username || "");
      setSurname(res.data.usersurname || "");
      setPhone(res.data.phone || "");
      setBio(res.data.bio || "");
    } catch (err: any) {
      console.error("Ошибка при получении данных:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert({ title: "Доступ", message: "Разрешение на доступ к галерее обязательно!" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const file = new File(uri);
      const fileInfo = await file.info();
      const filename = uri.split("/").pop() || "avatar.jpg";
      const extension = filename.split(".").pop()?.toLowerCase();
      const allowedExtensions = ["jpg", "jpeg", "png"];
      if (!extension || !allowedExtensions.includes(extension)) {
        alert({ title: "Ошибка", message: "Неподдерживаемый формат файла. Используйте JPG или PNG." });
        return;
      }
      if (fileInfo.size && fileInfo.size > 500 * 1024) {
        alert({ title: "Ошибка", message: "Файл слишком большой, максимум 500 KB" });
        return;
      }
      uploadAvatar(uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || `avatar.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append("file", {
        uri,
        name: filename,
        type,
      } as any);
      formData.append("bucket", "avatars");
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const newUrl = res.data.url;
      setUser((prev) => (prev ? { ...prev, avatar_url: res.data.url } : prev));
      updateAvatar(newUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const updateAvatar = async (uri: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await api.put("/auth/update-avatar", { avatar_url: uri });
    } catch (err) {
      console.log("updateAvatar", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading || !user) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  const renderAvatar = () => {
    if (user.avatar_url) {
      return (
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        </TouchableOpacity>
      );
    }
    const firstLetter = user.username?.[0]?.toUpperCase() || "?";
    return (
      <TouchableOpacity onPress={pickImage} style={styles.avatarPlaceholder}>
        <Text style={styles.avatarLetter}>{firstLetter}</Text>
      </TouchableOpacity>
    );
  };

  const updateProfile = async () => {
    try {
      const payload = {
        username: sanitizeInput(username),
        surname: sanitizeInput(surname),
        bio: sanitizeInput(bio),
        phone: phone.replace(/[^\d+ -]/g, ""),
      };
      if (!phoneRegex.test(phone)) {
        alert({ title: "Некорректный номер телефона", message: "Проверьте пожалуйста" });
        return;
      }
      const res = await api.put("/auth/update-profile", payload);
      setUser((prev) => (prev ? { ...prev, ...payload } : prev));
    } catch (err) {
      console.log("updateProfile error:", err);
    }
  };
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    navigation.replace("Login");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {renderAvatar()}
      <TextInput maxLength={20} style={styles.input} value={username} onChangeText={setUsername} placeholder="Имя" />
      <TextInput maxLength={20} style={styles.input} value={surname} onChangeText={setSurname} placeholder="Фамилия" />
      <TextInput style={[styles.input, styles.disabled]} value={user.email} editable={false} />
      <TextInput
        maxLength={15}
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Телефон"
        keyboardType="phone-pad"
      />
      <TextInput
        maxLength={140}
        style={[styles.input, styles.bio]}
        value={bio}
        onChangeText={setBio}
        placeholder="О себе..."
        multiline
      />
      <Text style={styles.logout} onPress={() => handleLogout()}>
        Выйти
      </Text>
      <Button
        title="Сохранить"
        onPress={() => updateProfile()}
        textStyle={styles.saveText}
        containerStyle={styles.saveBtn}
      />
      <Button
        title="Назад"
        onPress={() => navigation.goBack()}
        textStyle={styles.saveText}
        containerStyle={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 45,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 25,
  },

  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  avatarLetter: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#fff",
  },

  input: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 15,
  },

  disabled: {
    backgroundColor: "#f2f2f2",
    color: "#777",
  },

  bio: {
    height: 120,
    textAlignVertical: "top",
  },

  saveBtn: {
    backgroundColor: "#4A8CFF",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  logout: {
    width: "100%",
    color: "#007bff",
    textAlign: "right",
    fontSize: 20,
  },
});
