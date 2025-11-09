import React, { createContext, useContext, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface AlertOptions {
  title?: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const AlertContext = createContext<(options: AlertOptions) => void>(() => {});

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = (options: AlertOptions) => setAlert(options);
  const closeAlert = () => setAlert(null);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      {alert && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.box}>
              {alert.title && <Text style={styles.title}>{alert.title}</Text>}
              <Text style={styles.message}>{alert.message}</Text>
              <View style={styles.buttons}>
                {alert.cancelText && (
                  <TouchableOpacity
                    onPress={() => {
                      alert.onCancel?.();
                      closeAlert();
                    }}
                  >
                    <Text style={styles.cancel}>{alert.cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    alert.onConfirm?.();
                    closeAlert();
                  }}
                >
                  <Text style={styles.confirm}>{alert.confirmText || "OK"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  box: { backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "80%" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  message: { fontSize: 16, marginBottom: 20 },
  buttons: { flexDirection: "row", justifyContent: "flex-end" },
  confirm: { color: "#007bff", fontWeight: "600", marginLeft: 15 },
  cancel: { color: "#999" },
});
