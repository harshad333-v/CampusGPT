import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/users";
import StudentSidebar from "../components/StudentSidebar";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);

        const response = await getCurrentUser();

        console.log("Profile response:", response);

        if (!response.success) {
          setError(response.message || "Unable to load profile.");
          return;
        }

        setUser(response.user);
      } catch (err) {
        console.error("Profile error:", err);
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-400">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-red-600 transition-colors duration-300 dark:bg-slate-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      <StudentSidebar />

      <main className="pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
          
          <header className="mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Student Portal
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
              My Profile
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              View your account and academic information.
            </p>
          </header>

          {/* Personal Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 transition-colors duration-300 dark:border-slate-800 dark:bg-blue-600">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Personal Information
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Full Name
                </p>

                <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
                  {user?.name || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Email Address
                </p>

                <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
                  {user?.email || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Role
                </p>

                <p className="mt-1 capitalize font-medium text-slate-900 dark:text-slate-200">
                  {user?.role || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Student ID
                </p>

                <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
                  {user?.studentId || "Not available"}
                </p>
              </div>

            </div>
          </div>

          {/* Account Information */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 transition-colors duration-300 dark:border-slate-800 dark:bg-blue-600">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Account Information
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Account Status
                </p>

                <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
                  {user?.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Account Created
                </p>

                <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Not available"}
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Profile;