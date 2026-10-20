import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getUserById,
  updateUser,
} from "../../api/admin";

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRole(role = "") {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(name = "Admin") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function UserIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21a8 8 0 0 1 16 0"
      />
    </svg>
  );
}

function MailIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 7 9 6 9-6"
      />
    </svg>
  );
}

function BuildingIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21h16M6 21V5l6-3 6 3v16M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"
      />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3 20 6v5c0 5-3.2 8.5-8 10-4.8-1.5-8-5-8-10V6l8-3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 12 2 2 4-4"
      />
    </svg>
  );
}

function CalendarIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function EditIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 4-1 1 1-4L16.5 3.5Z"
      />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function AlertIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4M12 17h.01"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10.3 3.8-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.2l-8-14a2 2 0 0 0-3.4 0Z"
      />
    </svg>
  );
}

function AdminProfile() {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (!storedUser?._id && !storedUser?.id) {
        throw new Error(
          "Unable to identify the logged-in admin."
        );
      }

      const userId = storedUser._id || storedUser.id;

      const response = await getUserById(userId);

      const profile = response?.data || response?.user;

      if (!profile) {
        throw new Error(
          "Unable to load admin profile."
        );
      }

      setUser(profile);

      setForm({
        name: profile.name || "",
        email: profile.email || "",
      });
    } catch (err) {
      setError(
        err.message || "Failed to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openEditModal = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
    });

    setError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!user?._id) {
      setError("Unable to identify your account.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateUser(user._id, {
        name: form.name.trim(),
        email: form.email.trim(),
      });

      const updatedUser =
        response?.data || response?.user;

      if (updatedUser) {
        setUser(updatedUser);

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      } else {
        await loadProfile();
      }

      setShowEditModal(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(
        err.message || "Failed to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="min-h-screen px-4 pb-8 pt-24 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <p className="mb-1 text-sm font-medium text-blue-600">
              Administration
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage your administrator account information.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertIcon className="mt-0.5 shrink-0" />

              <div className="flex-1">
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-0.5">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                ✓
              </div>

              <span className="font-medium">
                {success}
              </span>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-20 shadow-sm">
              <div className="flex flex-col items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading profile...
                </p>
              </div>
            </div>
          ) : user ? (
            <>
              {/* Profile hero */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 sm:h-36" />

                <div className="px-5 pb-6 sm:px-7">
                  <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-900 text-2xl font-bold text-white shadow-lg sm:h-28 sm:w-28 sm:text-3xl">
                        {getInitials(user.name)}
                      </div>

                      <div className="pb-1">
                        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                          {user.name || "Administrator"}
                        </h2>

                        <p className="mt-0.5 text-sm text-slate-500">
                          {user.email || "No email available"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openEditModal}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                    >
                      <EditIcon />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Account overview */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileCard
                  icon={<UserIcon />}
                  label="Full Name"
                  value={user.name}
                />

                <ProfileCard
                  icon={<MailIcon />}
                  label="Email Address"
                  value={user.email}
                />

                <ProfileCard
                  icon={<ShieldIcon />}
                  label="Role"
                  value={formatRole(user.role)}
                />

                <ProfileCard
                  icon={<BuildingIcon />}
                  label="Department"
                  value={
                    user.department?.name ||
                    user.department?.code ||
                    "Not assigned"
                  }
                />

                <ProfileCard
                  icon={<UserIcon />}
                  label="Employee ID"
                  value={user.employeeId || "Not assigned"}
                />

                <ProfileCard
                  icon={<CalendarIcon />}
                  label="Account Created"
                  value={formatDate(user.createdAt)}
                />
              </div>

              {/* Account status */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Account Status
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Current status of your CampusGPT administrator account.
                    </p>
                  </div>

                  <div>
                    {user.isActive === false ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account information */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="font-semibold text-slate-900">
                    Account Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Information associated with your CampusGPT account.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoRow
                    label="User ID"
                    value={user._id}
                  />

                  <InfoRow
                    label="Last Updated"
                    value={formatDate(user.updatedAt)}
                  />

                  <InfoRow
                    label="Password Status"
                    value={
                      user.mustChangePassword
                        ? "Password change required"
                        : "Password configured"
                    }
                  />

                  <InfoRow
                    label="Account Role"
                    value={formatRole(user.role)}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Edit Profile
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Update your basic account information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full Name{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email Address{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs leading-5 text-slate-500">
                    Your role, account status and other administrative
                    fields are managed by the system and cannot be
                    changed from this profile form.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-all text-sm font-medium text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

export default AdminProfile;