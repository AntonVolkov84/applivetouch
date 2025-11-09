import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAlert } from "../context/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const schema = yup.object({
  email: yup
    .string()
    .email("Некорректный email")
    .required("Введите email")
    .matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, "Некорректный email"),
  password: yup.string().min(6, "Пароль должен быть не менее 6 символов").required("Введите пароль"),
});

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen({ navigation }: Props) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const alert = useAlert();
  const emailValue = watch("email");
  const passwordValue = watch("password");
  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await axios.post("https://api.livetouch.chat/auth/login", data);
      const user = res.data.user;
      const accessToken = res.data.accessToken;
      const refreshToken = res.data.refreshToken;
      await AsyncStorage.multiSet([
        ["accessToken", accessToken],
        ["refreshToken", refreshToken],
        ["user", JSON.stringify(user)],
      ]);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err: any) {
      console.error("Login error:", err.response?.data || err.message);
      alert({ title: "Ошибка входа", message: err.response?.data?.message || "Что-то пошло не так" });
    }
  };

  const onForgotPassword = async () => {
    try {
      if (!emailValue) {
        alert({
          title: "Ошибка",
          message: "Введите email в поле выше, на нее будет отправлено письмо для сброса пароля",
        });
        return;
      }
      if (!passwordValue) {
        alert({ title: "Ошибка", message: "Введите новый пароль в поле выше" });
        return;
      }
      alert({
        title: "Подтверждение",
        message:
          "На вашу почту будет отправлено письмо для восстановления. После подтверждения этот пароль станет новым. Продолжить?",
        confirmText: "Отправить",
        cancelText: "Отмена",
        onConfirm: async () => {
          try {
            await axios.post("https://api.livetouch.chat/auth/forgot-password", {
              email: emailValue,
              newPassword: passwordValue,
            });
            alert({
              title: "Письмо отправлено",
              message: "Ссылка для подтверждения сброса пароля выслана на вашу почту.",
            });
          } catch (err: any) {
            alert({
              title: "Ошибка",
              message: err.response?.data?.message || "Не удалось отправить письмо",
            });
          }
        },
      });
    } catch (err) {
      console.error("Forgot password error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход</Text>

      <Controller
        control={control}
        name="email"
        rules={{ required: "Введите email" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              placeholder="Email"
              value={value}
              onChangeText={onChange}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </>
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{ required: "Введите пароль" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              placeholder="Пароль"
              value={value}
              onChangeText={onChange}
              style={styles.input}
              secureTextEntry
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </>
        )}
      />

      <Button title={isSubmitting ? "Загрузка..." : "Войти"} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />
      <Text style={styles.forgotLink} onPress={() => onForgotPassword()}>
        Забыли пароль?
      </Text>
      <Text style={styles.registerLink} onPress={() => navigation.navigate("Register")}>
        Создать аккаунт
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  registerLink: {
    textAlign: "center",
    marginTop: 20,
    color: "#007bff",
  },
  error: {
    color: "red",
    fontSize: 13,
    marginBottom: 8,
  },
  forgotLink: {
    textAlign: "right",
    marginVertical: 10,
    color: "#007bff",
  },
});
