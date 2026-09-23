import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi } from "../api/client.js";
import Toast from "../components/Toast.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Show a transient notification; stays mounted across route changes.
  const notify = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);

  // Restore session on mount: the cookie carries the token, /me returns
  // the user. 401 → stay logged out.
  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user, pointsEarned } = await authApi.login({ email, password });
    setUser(user);
    return { user, pointsEarned };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { user } = await authApi.register({ name, email, password });
    setUser(user);
    return user;
  }, []);

  const updateProfile = useCallback(async (name, email) => {
    const { user } = await authApi.updateProfile({ name, email });
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    // Even if the call fails locally, drop the session state.
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateProfile, logout, notify }}
    >
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          onDone={() => setToast(null)}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
