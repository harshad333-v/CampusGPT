import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { changePassword } from "../api/auth";

function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // True only when the user comes from Settings
  const fromSettings = location.state?.fromSettings === true;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await changePassword(currentPassword, newPassword);

      if (!data.success) {
        setError(data.message || "Unable to change password.");
        return;
      }

      setSuccess(data.message || "Password changed successfully.");

      // If the user came voluntarily from Settings,
      // return them back to Settings after success.
      if (fromSettings) {
        setTimeout(() => {
          navigate("/settings");
        }, 1000);

        return;
      }

      // Existing forced password-change behavior remains unchanged
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      setTimeout(() => {
        if (!user) {
          navigate("/login");
          return;
        }

        switch (user.role) {
          case "student":
            navigate("/student");
            break;

          case "teacher":
            navigate("/teacher");
            break;

          case "admin":
            navigate("/admin");
            break;

          default:
            navigate("/login");
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to CampusGPT. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/settings");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-md">

        {/* Brand and Back Navigation */}
        <div className={fromSettings ? "mb-8" : "mb-10"}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              CampusGPT
            </h1>

            {fromSettings && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                ← Back to Settings
              </button>
            )}
          </div>

          {fromSettings && (
            <p className="mt-1 text-sm text-slate-500">
              Account Security
            </p>
          )}
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Change your password
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {fromSettings
                ? "Update your password to keep your CampusGPT account secure."
                : "For security, you need to change your password before continuing."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Current Password
              </label>

              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                New Password
              </label>

              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Changing password..." : "Change Password"}
              </button>

              {/* Cancel shown only for voluntary password changes */}
              {fromSettings && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default ChangePassword;