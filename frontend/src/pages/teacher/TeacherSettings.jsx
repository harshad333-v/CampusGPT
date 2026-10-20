import { useNavigate } from "react-router-dom";

import TeacherSidebar from "../../components/TeacherSidebar";

function TeacherSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b10]">
      <TeacherSidebar />

      <main className="pt-24 lg:pt-8 lg:ml-64 min-h-screen p-4 sm:p-8">
        {/* Page Heading */}
        <div className="mb-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Teacher Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your account preferences and security settings.
          </p>
        </div>

        <div className="max-w-5xl space-y-6">
          {/* Appearance */}
          <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Appearance
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Customize how CampusGPT looks.
            </p>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Theme
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Choose between light and dark mode.
                </p>
              </div>

              <button
                type="button"
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
              >
                🌙 Switch to Dark
              </button>
            </div>
          </section>

          {/* Account Settings */}
          <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Account Settings
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage your account information and preferences.
            </p>

            {/* Profile Information */}
            <div className="mt-6 flex items-center justify-between border-b border-slate-200 py-5 dark:border-white/[0.06]">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Profile Information
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  View your personal and teaching information.
                </p>
              </div>

              <span className="text-slate-500 dark:text-slate-400">
                Available
              </span>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between border-b border-slate-200 py-5 dark:border-white/[0.06]">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Password
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Change your account password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/teacher/change-password")}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
              >
                Change Password
              </button>
            </div>

            {/* Account Status */}
            <div className="flex items-center justify-between pt-5">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Account Status
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Your account is currently active.
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
                Active
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default TeacherSettings;