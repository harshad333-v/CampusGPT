import { useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { useTheme } from "../context/useTheme";

function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {/* Common Sidebar */}
      <StudentSidebar />

      {/* Main Content */}
      <main className="pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">

          {/* Header */}
          <header className="mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Student Portal
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Manage your account preferences and security settings.
            </p>
          </header>

          {/* Appearance Settings */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-700 dark:bg-blue-600">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Appearance
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Customize how CampusGPT looks.
            </p>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Theme
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Choose between light and dark mode.
                </p>
              </div>

              <button
                onClick={toggleTheme}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {theme === "light"
                  ? "🌙 Switch to Dark"
                  : "☀️ Switch to Light"}
              </button>
            </div>
          </section>

          {/* Account Settings */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-700 dark:bg-blue-600">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Account Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your account information and preferences.
            </p>

            <div className="mt-6 space-y-4">

              {/* Profile Information */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Profile Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    View your personal and academic information.
                  </p>
                </div>

                <span className="text-sm text-slate-400">
                  Available
                </span>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Password
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Change your account password.
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate("/change-password", {
                      state: { fromSettings: true },
                    })
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Change Password
                </button>
              </div>

              {/* Account Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Account Status
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your account is currently active.
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  Active
                </span>
              </div>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default Settings;