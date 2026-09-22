import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = logged out

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback exchanges the session_id and establishes the session first.
    if (window.location.hash?.includes("session_id=")) {
      return;
    }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(false));
  }, []);

  const loginWithEmail = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    setUser(response.data);
    return response.data;
  };

  const loginWithGoogle = (path = "/") => {
    // Legacy OAuth flow retained for existing client sessions.
    const redirectUrl = window.location.origin + path;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginWithEmail, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
