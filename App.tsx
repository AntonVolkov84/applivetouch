import React from "react";
import AppNavigator from "./navigation/AppNavigator";
import { AlertProvider } from "./context/AppContext";
import { UserProvider } from "./context/UserContext";

export default function App() {
  return (
    <UserProvider>
      <AlertProvider>
        <AppNavigator />
      </AlertProvider>
    </UserProvider>
  );
}
