import { useEffect, useState } from "react";

import AdminSidebar from "../../components/AdminSidebar";
import { getAdminDashboard } from "../../api/admin";

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =========================================================
     LOAD ADMIN DASHBOARD
  ========================================================= */

  useEffect(() => {
    async function loadAdminDashboard() {
      try {
        setLoading(true);

        setError("");

        const response =
          await getAdminDashboard();

        if (!response.success) {
          setError(
            response.message ||
              "Unable to load dashboard data.",
          );

          return;
        }

        setDashboardData(
          response.data || null,
        );
      } catch (err) {
        console.error(
          "Admin dashboard error:",
          err,
        );

        setError(
          "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAdminDashboard();
  }, []);

  const statistics =
    dashboardData?.statistics || {};

  const recentDocuments =
    dashboardData?.recentDocuments || [];

  const recentNotifications =
    dashboardData?.recentNotifications || [];

  const user =
    dashboardData?.user || null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090b10]">

      {/* ADMIN SIDEBAR */}

      <AdminSidebar />

      {/* MAIN CONTENT */}

      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">

        {/* PAGE HEADER */}

        <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-white/[0.06] dark:bg-[#0d1017] lg:px-10">

          <div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Administration Overview
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>

          </div>

        </div>

        {/* DASHBOARD CONTENT */}

        <div className="px-6 py-8 lg:px-10">

          <div className="mx-auto max-w-7xl">

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">

                {error}

              </div>
            )}

            {/* WELCOME SECTION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">

                {loading
                  ? "Welcome to the Admin Portal"
                  : `Welcome${
                      user?.name
                        ? `, ${user.name}`
                        : ""
                    }`}

              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">

                Manage users, departments, documents,
                notifications, and other CampusGPT
                administrative activities from one place.

              </p>

            </div>

            {/* STATISTICS */}

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              {/* TOTAL STUDENTS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Students
                </p>

                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">

                  {loading
                    ? "--"
                    : statistics.totalStudents ?? 0}

                </p>

              </div>

              {/* TOTAL TEACHERS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Teachers
                </p>

                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">

                  {loading
                    ? "--"
                    : statistics.totalTeachers ?? 0}

                </p>

              </div>

              {/* TOTAL DEPARTMENTS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Departments
                </p>

                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">

                  {loading
                    ? "--"
                    : statistics.totalDepartments ?? 0}

                </p>

              </div>

              {/* ACTIVE DOCUMENTS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Active Documents
                </p>

                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">

                  {loading
                    ? "--"
                    : statistics.totalDocuments ?? 0}

                </p>

              </div>

            </div>

            {/* RECENT ACTIVITY */}

            <div className="mt-6 grid gap-6 xl:grid-cols-2">

              {/* RECENT DOCUMENTS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recent Documents
                </h3>

                {loading ? (

                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Loading documents...
                  </p>

                ) : recentDocuments.length === 0 ? (

                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    No recent documents available.
                  </p>

                ) : (

                  <div className="mt-4 space-y-3">

                    {recentDocuments.map(
                      (document, index) => (
                        <div
                          key={
                            document._id ||
                            document.id ||
                            index
                          }
                          className="rounded-xl border border-slate-100 px-4 py-3 dark:border-white/[0.06]"
                        >

                          <p className="text-sm font-medium text-slate-800 dark:text-white">

                            {document.title ||
                              document.name ||
                              "Untitled Document"}

                          </p>

                        </div>
                      ),
                    )}

                  </div>

                )}

              </div>

              {/* RECENT NOTIFICATIONS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recent Notifications
                </h3>

                {loading ? (

                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Loading notifications...
                  </p>

                ) : recentNotifications.length === 0 ? (

                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    No recent notifications available.
                  </p>

                ) : (

                  <div className="mt-4 space-y-3">

                    {recentNotifications.map(
                      (notification, index) => (
                        <div
                          key={
                            notification._id ||
                            notification.id ||
                            index
                          }
                          className="rounded-xl border border-slate-100 px-4 py-3 dark:border-white/[0.06]"
                        >

                          <p className="text-sm font-medium text-slate-800 dark:text-white">

                            {notification.title ||
                              "Notification"}

                          </p>

                          {notification.message && (

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                              {notification.message}

                            </p>

                          )}

                        </div>
                      ),
                    )}

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;