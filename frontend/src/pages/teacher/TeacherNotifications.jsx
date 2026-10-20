import { useEffect, useState } from "react";

import TeacherSidebar from "../../components/TeacherSidebar";
import { getNotifications } from "../../api/notifications";
import { API_BASE_URL } from "../../api/client";

function TeacherNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getNotifications();



      if (response.success) {
        setNotifications(response.data || []);
      } else {
        setError(
          response.message || "Failed to load notifications."
        );
      }
    } catch (err) {
      setError(
        err.message || "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setTargetRole("ALL");
    setEditingNotification(null);
    setFormError("");
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setTitle(notification.title || "");
    setMessage(
      notification.message ||
      notification.content ||
      ""
    );
    setTargetRole(notification.targetRole || "ALL");
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!title.trim()) {
      setFormError("Please enter a notification title.");
      return;
    }

    if (!message.trim()) {
      setFormError("Please enter a notification message.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const url = editingNotification
        ? `${API_BASE_URL}/notifications/${editingNotification._id}`
        : `${API_BASE_URL}/notifications`;

      const response = await fetch(url, {
        method: editingNotification ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetRole,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(
          data.message ||
          `Failed to ${editingNotification ? "update" : "create"
          } notification.`
        );
        return;
      }

      setShowForm(false);
      resetForm();

      await loadNotifications();
    } catch (err) {
      console.error(err);

      setFormError(
        err.message ||
        `Unable to ${editingNotification ? "update" : "create"
        } notification.`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b10]">
      <TeacherSidebar />

      <main className="min-h-screen p-4 pt-24 sm:p-8 lg:ml-64 lg:pt-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Notifications
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Stay updated with important announcements and updates.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            + Create Notification
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-slate-600 dark:text-slate-400">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
            {error}
          </div>
        )}

        {/* Notifications */}
        {!loading && !error && (
          <>
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  No notifications
                </h2>

                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  You are all caught up. There are no notifications at the
                  moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">

                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/[0.06] dark:bg-[#0d1017]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {notification.title || "Notification"}
                        </h2>

                        <p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">
                          {notification.message ||
                            notification.content ||
                            "No notification details available."}
                        </p>

                        {notification.targetRole && (
                          <div className="mt-4">
                            <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                              Target: {notification.targetRole}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                        <span className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleDateString()
                            : ""}
                        </span>

                        {notification.createdBy?.role === "teacher" && (
                          <button
                            type="button"
                            onClick={() => handleEdit(notification)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#0d1017]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {editingNotification
                    ? "Edit Notification"
                    : "Create Notification"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingNotification
                    ? "Update the notification details."
                    : "Create an announcement for your campus users."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="text-2xl leading-none text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="notification-title"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Title
                </label>

                <input
                  id="notification-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#090b10] dark:text-white dark:focus:border-white dark:focus:ring-white"
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="notification-message"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Message
                </label>

                <textarea
                  id="notification-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter notification message"
                  rows={5}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#090b10] dark:text-white dark:focus:border-white dark:focus:ring-white"
                />
              </div>

              {/* Target Role */}
              <div>
                <label
                  htmlFor="notification-target"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Target audience
                </label>

                <select
                  id="notification-target"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#090b10] dark:text-white dark:focus:border-white dark:focus:ring-white"
                >
                  <option value="ALL">All users</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>

              {/* Form Error */}
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {saving
                    ? editingNotification
                      ? "Updating..."
                      : "Creating..."
                    : editingNotification
                      ? "Update Notification"
                      : "Create Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherNotifications;