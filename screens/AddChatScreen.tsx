import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Button from "../components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAlert } from "../context/AppContext";
import { api } from "../axiosInstance";
import { useUser } from "../context/UserContext";

type Props = NativeStackScreenProps<RootStackParamList, "AddChat">;

export default function AddChatScreen({ navigation }: Props) {
  const [mode, setMode] = useState<"private" | "group">("private");
  const [email, setEmail] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupEmails, setGroupEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const alert = useAlert();
  const { user } = useUser();

  const sanitize = (text: string) => text.replace(/<[^>]*>?/gm, "");
  const normalizeEmail = (text: string) => sanitize(text).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handlePrivateSubmit = async () => {
    const cleaned = normalizeEmail(email);
    if (cleaned === user?.email?.toLowerCase()) {
      alert({ title: "Себя добавляешь?", message: "Можешь с собой и так поговорить!" });
      return;
    }
    if (!cleaned) {
      alert({ title: "Ошибка", message: "Введите email." });
      return;
    }
    if (!emailRegex.test(cleaned)) {
      alert({ title: "Ошибка", message: "Некорректный email." });
      return;
    }
    try {
      const res = await api.post("/chats/createprivate", {
        type: "private",
        email: cleaned,
      });
      if (res.data.chatId) {
        navigation.navigate("Home");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert({ title: "Не найден", message: "Пользователь с таким email не существует." });
      } else {
        alert({ title: "Ошибка", message: "Не удалось создать чат." });
      }
    }
  };

  const addEmailToGroup = () => {
    const cleaned = normalizeEmail(emailInput);
    if (cleaned === user?.email?.toLowerCase()) {
      alert({ title: "Себя добавляешь?", message: "Можешь с собой и так поговорить!" });
      return;
    }
    if (!cleaned) return;
    if (!emailRegex.test(cleaned)) {
      alert({ title: "Ошибка", message: "Некорректный email." });
      return;
    }
    if (groupEmails.includes(cleaned)) {
      alert({ title: "Ошибка", message: "Этот email уже добавлен." });
      return;
    }
    setGroupEmails([...groupEmails, cleaned]);
    setEmailInput("");
  };

  const handleGroupSubmit = () => {
    if (!groupName.trim()) {
      alert({ title: "Ошибка", message: "Введите название группы." });
      return;
    }
    if (groupEmails.length < 1) {
      alert({ title: "Ошибка", message: "Добавьте хотя бы одного участника." });
      return;
    }
    console.log("Создание группы:", {
      groupName,
      emails: groupEmails,
    });
    setGroupEmails([]);
    setGroupName("");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Новый чат</Text>

      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchBtn, mode === "private" && styles.switchActive]}
          onPress={() => {
            setMode("private");
          }}
        >
          <Text style={styles.switchText}>Приватный</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchBtn, mode === "group" && styles.switchActive]}
          onPress={() => {
            setMode("group");
          }}
        >
          <Text style={styles.switchText}>Группа</Text>
        </TouchableOpacity>
      </View>
      {mode === "private" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Введите email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            title="Создать чат"
            onPress={handlePrivateSubmit}
            containerStyle={styles.btn}
            textStyle={styles.btnText}
          />
        </>
      )}
      {mode === "group" && (
        <>
          <TextInput style={styles.input} placeholder="Название группы" value={groupName} onChangeText={setGroupName} />
          <View>
            <TextInput
              style={styles.input}
              placeholder="Добавить email"
              value={emailInput}
              onChangeText={(text) => {
                setEmailInput(text);
              }}
              onSubmitEditing={addEmailToGroup}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Добавить участника"
              onPress={addEmailToGroup}
              containerStyle={styles.btnSmall}
              textStyle={styles.btnText}
            />
          </View>
          {groupEmails.map((e, idx) => (
            <TouchableOpacity
              key={idx}
              onLongPress={() => {
                alert({
                  title: "Удалить участника",
                  message: `Вы уверены, что хотите удалить ${e}?`,
                  confirmText: "Удалить",
                  cancelText: "Отмена",
                  onConfirm: () => {
                    setGroupEmails((prev) => prev.filter((email) => email !== e));
                  },
                });
              }}
            >
              <Text style={styles.emailItem}>• {e}</Text>
            </TouchableOpacity>
          ))}
          <Button
            title="Создать группу"
            onPress={handleGroupSubmit}
            containerStyle={styles.btn}
            textStyle={styles.btnText}
          />
        </>
      )}

      <Button
        title="Назад"
        onPress={() => navigation.goBack()}
        containerStyle={{ marginTop: 20 }}
        textStyle={styles.btnText}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 25 },
  input: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 15,
  },

  switchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#e5e5e5",
    alignItems: "center",
  },
  switchActive: {
    backgroundColor: "#007bff",
  },
  switchText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  emailItem: {
    fontSize: 20,
    marginBottom: 6,
  },

  btn: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  btnSmall: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
