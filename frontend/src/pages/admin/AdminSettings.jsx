import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { API_BASE_URL } from "../../api/client";

function LockIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10V7a4 4 0 0 1 8 0v3"
      />
      <circle cx="12" cy="15.5" r="1" />
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

function LogOutIcon({ className = "h-5 w-5" }) {
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
        d="M10 17l5-5-5-5"
      />
      <path
        strokeLinecap="round"
        d="M15 12H3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 19V5a2 2 0 0 0-2-2h-7"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }) {
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
        d="m5 12 4 4L19 6"
      />
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

function EyeIcon({ className = "h-5 w-5" }) {
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
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-5 w-5" }) {
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
        d="m3 3 18 18"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.9 4.3A10.7 10.7 0 0 1 12 4c6 0 9.5 8 9.5 8a16.7 16.7 0 0 1-3.1 4.1M6.2 6.2C3.6 8.1 2.5 12 2.5 12S6 20 12 20c1.3 0 2.5-.3 3.6-.8"
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

async function changePassword(passwordData) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/auth/change-password`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passwordData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to change password."
    );
  }

  return data;
}

function AdminSettings() {
  const navigate = useNavigate();

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setError("");
    setSuccess("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (saving) return;

    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!passwordForm.currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (!passwordForm.newPassword) {
      setError("New password is required.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (
      passwordForm.currentPassword ===
      passwordForm.newPassword
    ) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setSaving(true);

      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setSuccess("Password changed successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccess("");
      }, 1200);
    } catch (err) {
      setError(
        err.message || "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
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
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your administrator account and security settings.
            </p>
          </div>

          {/* Security overview */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldIcon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Account Security
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Keep your administrator account secure by regularly
                    reviewing your password.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Password */}
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <LockIcon />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Password
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Change your account password.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
                >
                  <LockIcon className="h-4 w-4" />
                  Change Password
                </button>
              </div>

              {/* Authentication */}
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckIcon />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Authentication
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Your account uses authenticated CampusGPT sessions.
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Protected
                </span>
              </div>
            </div>
          </div>

          {/* Account preferences */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <UserIcon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Account
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your account information from the appropriate
                    Admin Portal sections.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Profile
                </p>

                <p className="mt-1.5 text-sm font-medium text-slate-700">
                  Update your name and email from your profile.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/profile")
                  }
                  className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Go to Profile →
                </button>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  User Management
                </p>

                <p className="mt-1.5 text-sm font-medium text-slate-700">
                  Manage users, roles, departments and account status.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/users")
                  }
                  className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Manage Users →
                </button>
              </div>
            </div>
          </div>

          {/* Session */}
          <div className="rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <LogOutIcon />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Current Session
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Sign out of your current CampusGPT administrator
                    session.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:w-auto"
              >
                <LogOutIcon className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Change Password
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Update your CampusGPT administrator password.
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="p-5 sm:p-6"
            >
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />

                  <p className="leading-5">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />

                  <p className="leading-5">{success}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Current Password{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (previous) => !previous
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    New Password{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (previous) => !previous
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Use at least 8 characters.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Confirm New Password{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) => !previous
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs leading-5 text-blue-700">
                  After changing your password, continue using your
                  current authenticated session unless the backend
                  requires re-authentication.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePasswordModal}
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

                  {saving
                    ? "Changing..."
                    : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;