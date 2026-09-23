import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRole(role) {
  return role === "admin" ? "Administrator" : "Customer";
}

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setBanner("");
    setPending(true);
    try {
      await updateProfile(name, email);
      setEditing(false);
    } catch (err) {
      if (err.errors) {
        const byField = {};
        for (const { field, message } of err.errors) {
          byField[field] = message;
        }
        setFieldErrors(byField);
      } else {
        setBanner(err.message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{getInitials(user.name)}</div>
          <div className="profile-header-info">
            <h1 className="profile-name">{user.name}</h1>
            <span className="profile-role">{formatRole(user.role)}</span>
            <span className="profile-points">⭐ {user.points} points</span>
          </div>
        </div>

        {editing ? (
          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            {banner && <p className="auth-banner">{banner}</p>}

            <label className="profile-field">
              <span className="profile-field-label">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                disabled={pending}
              />
              {fieldErrors.name && (
                <span className="auth-error">{fieldErrors.name}</span>
              )}
            </label>

            <label className="profile-field">
              <span className="profile-field-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={pending}
              />
              {fieldErrors.email && (
                <span className="auth-error">{fieldErrors.email}</span>
              )}
            </label>

            <div className="profile-actions">
              <button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={pending}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="profile-details">
              <div className="profile-detail">
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div className="profile-detail">
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="profile-detail">
                <dt>Role</dt>
                <dd>{formatRole(user.role)}</dd>
              </div>
            </dl>

            <div className="profile-actions">
              <button onClick={() => setEditing(true)}>Edit Profile</button>
              <button onClick={handleLogout} className="btn-ghost">
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}