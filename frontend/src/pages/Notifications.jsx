import { useEffect, useState } from "react";
import { getNotifications } from "../api/notifications";
import StudentSidebar from "../components/StudentSidebar";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);

        const response = await getNotifications();

        console.log("Notifications response:", response);

        if (!response.success) {
          setError(
            response.message || "Unable to load notifications."
          );
          return;
        }

        setNotifications(response.data || []);
      } catch (err) {
        console.error("Notifications error:", err);
        setError("Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  function formatDate(date) {
    if (!date) {
      return "Date not available";
    }

    return new Date(date).toLocaleString();
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      
      {/* Common Sidebar */}
      <StudentSidebar />

      {/* Main Content */}
      <main className="pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">

          <header className="mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Student Portal
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Notifications
            </h2>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Stay updated with important academic announcements.
            </p>
          </header>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 transition-colors dark:border-slate-800 dark:bg-blue-600 dark:text-slate-400">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-white p-6 text-red-600 transition-colors dark:border-red-900/50 dark:bg-blue-600 dark:text-red-400">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 transition-colors dark:border-slate-800 dark:bg-blue-600 dark:text-slate-400">
              No notifications available.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-blue-600 dark:hover:border-slate-700 dark:hover:shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {notification.title}
                      </h3>

                      <p className="mt-2 text-slate-600 dark:text-slate-300">
                        {notification.message}
                      </p>
                    </div>

                    <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(notification.createdAt)}
                    </span>

                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Posted by:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {notification.createdBy?.name || "CampusGPT"}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Notifications;