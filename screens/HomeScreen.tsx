import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TextInput, Image, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Chat } from "../types";
import { api } from "../axiosInstance";
import { useUser } from "../context/UserContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { user, setUser } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const ws = new WebSocket("wss://api.livetouch.chat/ws");

    ws.onopen = () => {
      ws.send(JSON.stringify({ userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat_created") {
          setChats((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error("WS error:", e);
      }
    };

    ws.onerror = (err) => console.log("WS error:", err);
    ws.onclose = () => console.log("WS closed");

    return () => ws.close();
  }, []);

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
  const fetchChats = async () => {
    try {
      const res = await api.get("/chats/getchats");
      console.log(res.data);
      setChats(res.data);
    } catch (err: any) {
      console.error("Ошибка при получении чатов:", err.response?.data || err.message);
    }
  };

  const handleSearch = () => {
    console.log("Поиск:", searchQuery);
    setSearchQuery("");
  };
  useEffect(() => {
    fetchUser();
    fetchChats();
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
      <FlatList
        data={chats}
        keyExtractor={(item) => item.chat_id?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 10, paddingHorizontal: 20 }}
        renderItem={({ item }) => {
          const userInfo = item.type === "private" ? item.otherUser : null;

          return (
            <View style={styles.chatItem}>
              {userInfo ? (
                <View style={styles.chatRow}>
                  {userInfo.avatar_url ? (
                    <Image source={{ uri: userInfo.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>{userInfo.username?.[0]?.toUpperCase() || "U"}</Text>
                    </View>
                  )}
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>
                      {userInfo.username} {userInfo.usersurname}
                    </Text>
                    <Text style={styles.chatEmail}>{userInfo.email}</Text>
                    <Text style={styles.chatDate}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>Group Chat: {item.name}</Text>
                  <Text style={styles.chatDate}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
              )}
            </View>
          );
        }}
      />
      <View style={styles.addButton} onTouchEnd={() => navigation.navigate("AddChat")}>
        <Text style={styles.addButtonIcon}>+</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
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
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  addButtonIcon: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: -2,
  },
  chatItem: {
    width: "100%",
    flexDirection: "column",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },

  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarInitial: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },

  chatName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
    color: "#333",
  },

  chatEmail: {
    fontSize: 14,
    color: "#666",
  },

  chatDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});
