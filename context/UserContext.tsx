import React, { createContext, useContext, useState } from "react";
import { UserAuthData } from "../types";

interface UserContextValue {
  user: UserAuthData | null;
  setUser: (u: UserAuthData | null) => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserAuthData | null>(null);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
