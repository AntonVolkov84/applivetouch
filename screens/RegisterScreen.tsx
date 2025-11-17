import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAlert } from "../context/AppContext";
import Button from "../components/Button";
import { Ionicons } from "@expo/vector-icons";
import { RegisterFormData } from "../types";
import { api } from "../axiosInstance";
import { Recaptcha, RecaptchaAction, type RecaptchaClient } from "@google-cloud/recaptcha-enterprise-react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

const schema = yup.object({
  username: yup
    .string()
    .required("Введите имя")
    .matches(/^[^<>]*$/, "Недопустимые символы: < или >"),
  usersurname: yup
    .string()
    .required("Введите фамилию")
    .matches(/^[^<>]*$/, "Недопустимые символы: < или >"),
  email: yup.string().email("Некорректный email").required("Введите email"),
  password: yup.string().min(6, "Пароль должен быть не менее 6 символов").required("Введите пароль"),
});

export default function RegisterScreen({ navigation }: Props) {
  const {
    control,
    handleSubmit: rhfSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
    defaultValues: { username: "", usersurname: "", email: "", password: "" },
  });
  const alert = useAlert();
  const [showPassword, setShowPassword] = useState(false);
  const siteKey = process.env.RECAPTCHA_SITE_KEY;

  const sendFormToBackend = async (data: RegisterFormData, token: string) => {
    try {
      const normalizedData = { ...data, email: data.email.trim().toLowerCase(), captchaToken: token };
      await api.post("/auth/register", normalizedData);
      alert({
        title: "Регистрация успешна",
        message: `Письмо для подтверждения отправлено на ${normalizedData.email}.`,
        onConfirm: () => navigation.navigate("Login"),
      });
    } catch (err: any) {
      console.error("Register error:", err.response?.data || err.message);
      alert({ title: "Ошибка регистрации", message: err.response?.data?.message || "Что-то пошло не так" });
    }
  };

  const onSubmitForm = async (data: RegisterFormData) => {
    try {
      let token;
      if (!siteKey) {
        alert({ title: "Ошибка", message: "Не указан ключ reCAPTCHA" });
        return;
      }
      const client = await Recaptcha.fetchClient(siteKey);
      token = await client.execute(RecaptchaAction.custom("register"));
      await sendFormToBackend(data, token);
    } catch (err) {
      console.error(err);
      alert({ title: "Ошибка", message: "Не удалось пройти проверку" });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>

      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput placeholder="Имя" value={value} onChangeText={onChange} style={styles.input} />
            {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}
          </>
        )}
      />

      <Controller
        control={control}
        name="usersurname"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput placeholder="Фамилия" value={value} onChangeText={onChange} style={styles.input} />
            {errors.usersurname && <Text style={styles.error}>{errors.usersurname.message}</Text>}
          </>
        )}
      />

      <Controller
        control={control}
        name="email"
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
        render={({ field: { onChange, value } }) => (
          <>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Пароль"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                style={[styles.inputPassword, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </>
        )}
      />

      <Button
        title={isSubmitting ? "Загрузка..." : "Создать аккаунт"}
        onPress={rhfSubmit(onSubmitForm)}
        disabled={isSubmitting}
      />
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.loginLink}>Уже есть аккаунт? Войти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12 },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  inputPassword: { width: "90%", paddingLeft: 0 },
  loginLink: { textAlign: "center", marginTop: 20, color: "#007bff" },
  error: { color: "red", fontSize: 13, marginBottom: 8 },
});
