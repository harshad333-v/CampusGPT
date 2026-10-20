import { useEffect, useState } from "react";

import { getDashboard } from "../../api/dashboard";
import TeacherSidebar from "../../components/TeacherSidebar";

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await getDashboard();

        if (!response.success) {
          setError(response.message || "Unable to load dashboard.");
          return;
        }

        setData(response.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-red-600 dark:bg-slate-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  const {
    user,
    department,
    uploadedDocuments,
    recentNotifications,
    statistics,
  } = data || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Teacher Sidebar */}
      <TeacherSidebar />

      {/* Main Content */}
      <main className="pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

          {/* Header */}
          <header className="mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Teacher Dashboard
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.name || "Teacher"}
            </h2>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {department?.name || "Department not available"}
              {department?.code && ` • ${department.code}`}
            </p>
          </header>

          {/* Information Cards */}
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {/* Employee ID */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-blue-600">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Employee ID
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {user?.employeeId || "Not available"}
              </p>
            </div>

            {/* Department */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-blue-600">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Department
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {department?.name || "Not available"}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {department?.code || "Not available"}
              </p>
            </div>

            {/* Documents Uploaded */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-blue-600">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Documents Uploaded
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {statistics?.uploadedDocuments ?? 0}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Total documents uploaded by you
              </p>
            </div>

          </section>

          {/* Recent Documents */}
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Recent Documents
              </h3>
            </div>

            {uploadedDocuments?.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {uploadedDocuments.map((document) => (
                  <div
                    key={document._id}
                    className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-blue-600"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {document.documentType}
                    </p>

                    <h4 className="mt-3 font-semibold text-slate-900 dark:text-white">
                      {document.title}
                    </h4>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {document.description || "No description available."}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>
                        {document.semester
                          ? `Semester ${document.semester}`
                          : "Semester not specified"}
                      </span>

                      <span>
                        {document.visibility || "Not specified"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-blue-600 dark:text-slate-400">
                No uploaded documents available.
              </div>
            )}
          </section>

          {/* Recent Notifications */}
          <section className="mt-8">
            <h3 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
              Recent Notifications
            </h3>

            {recentNotifications?.length > 0 ? (
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-blue-600"
                  >
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {notification.title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {notification.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-blue-600 dark:text-slate-400">
                No recent notifications available.
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

export default TeacherDashboard;