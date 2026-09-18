import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <main className="app">
      <h1>Ecommerce Platform</h1>
      <p>
        Logged in as <strong>{user.name}</strong> ({user.email}) —{" "}
        role {user.role}
      </p>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}
