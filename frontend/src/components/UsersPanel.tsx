import { useEffect, useState } from "react";
import { api } from "../api";
import type { UserRole } from "../types";

interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

interface Props {
  onError: (message: string) => void;
}

export default function UsersPanel({ onError }: Props) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const response = await api.listUsers();
      setUsers(response.users);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function changeRole(userId: string, role: "student" | "staff") {
    setSavingId(userId);
    onError("");
    try {
      const response = await api.updateUserRole(userId, role);
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, ...response.user } : user));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not update the user's role.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="documents-view">
      <header className="topbar">
        <div>
          <div className="topbar-title">User access</div>
          <div className="topbar-subtitle">Manage student and staff access. Administrator promotion is kept separate.</div>
        </div>
        <button className="button button-subtle" onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh ↻"}</button>
      </header>

      <div className="documents-content">
        <div className="documents-list-card">
          <div className="list-card-heading">
            <div><h2>Campus accounts</h2><p>New registrations default to student access.</p></div>
            <div className="document-total"><strong>{users.length}</strong><span>accounts</span></div>
          </div>

          {loading ? <div className="empty-state">Loading users…</div> : users.length === 0 ? (
            <div className="empty-state"><h3>No accounts found</h3></div>
          ) : (
            <div className="document-list">
              {users.map((user) => (
                <article className="user-row" key={user.id}>
                  <div className="profile-avatar">{user.fullName.slice(0, 1).toUpperCase()}</div>
                  <div className="document-info">
                    <strong>{user.fullName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className={`role-pill role-${user.role}`}>{user.role}</span>
                  <label className="role-select-label">
                    <span className="visually-hidden">Role for {user.fullName}</span>
                    <select
                      value={user.role === "admin" ? "admin" : user.role}
                      disabled={savingId === user.id || user.role === "admin"}
                      onChange={(event) => void changeRole(user.id, event.target.value as "student" | "staff")}
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      {user.role === "admin" && <option value="admin">Admin</option>}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          )}
        </div>
        <p className="tiny muted documents-disclaimer">This screen can assign staff access to existing accounts. Additional administrators must be created through the server-side bootstrap process or an authorized database administrator.</p>
      </div>
    </section>
  );
}
