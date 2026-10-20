import { useEffect, useState } from "react";

import TeacherSidebar from "../../components/TeacherSidebar";
import { getCurrentUser } from "../../api/users";

function TeacherProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await getCurrentUser();

        if (response.success) {
          const userData =
            response.data?.user || response.data || response.user;

          if (userData) {
            setUser(userData);
          } else {
            setError("User profile data was not found.");
          }
        } else {
          setError(response.message || "Failed to load profile.");
        }
      } catch (err) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b10]">
      <TeacherSidebar />

      <main className="pt-24 lg:pt-8 lg:ml-64 min-h-screen p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            My Profile
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            View your account and profile information.
          </p>
        </div>

        {loading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-slate-600 dark:text-slate-400">
              Loading profile...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && user && (
          <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <div className="flex items-center gap-5 border-b border-slate-200 pb-6 dark:border-white/[0.06]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white dark:bg-white dark:text-slate-900">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user.name || "User"}
                </h2>

                <p className="mt-1 capitalize text-slate-600 dark:text-slate-400">
                  {user.role || "Teacher"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Full Name</p>
                <p className="mt-1 text-base font-medium text-slate-900">
                  {user.name || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Email Address
                </p>
                <p className="mt-1 break-all text-base font-medium text-slate-900">
                  {user.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Role</p>
                <p className="mt-1 capitalize text-base font-medium text-slate-900">
                  {user.role || "—"}
                </p>
              </div>

              {user.employeeId && (
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Employee ID
                  </p>
                  <p className="mt-1 text-base font-medium text-slate-900">
                    {user.employeeId}
                  </p>
                </div>
              )}

              {user.department && (
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Department
                  </p>
                  <p className="mt-1 text-base font-medium text-slate-900">
                    {user.department.name || user.department}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherProfile;
