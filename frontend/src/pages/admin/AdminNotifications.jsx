import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { API_BASE_URL } from "../../api/client";

const TARGET_ROLES = ["ALL", "student", "teacher", "admin"];

const INITIAL_FORM = {
  title: "",
  message: "",
  targetRole: "ALL",
};

function getAuthHeaders(includeContentType = false) {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    ...(includeContentType
      ? { "Content-Type": "application/json" }
      : {}),
  };
}

async function getNotifications() {
  const response = await fetch(
    `${API_BASE_URL}/notifications`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch notifications."
    );
  }

  return data;
}

async function getNotificationById(notificationId) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch notification."
    );
  }

  return data;
}

async function createNotification(notificationData) {
  const response = await fetch(
    `${API_BASE_URL}/notifications`,
    {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(notificationData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create notification."
    );
  }

  return data;
}

async function updateNotification(
  notificationId,
  notificationData
) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(notificationData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update notification."
    );
  }

  return data;
}

async function deleteNotification(notificationId) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete notification."
    );
  }

  return data;
}

function formatTargetRole(role = "") {
  if (role === "ALL") return "Everyone";

  if (role === "student") return "Students";

  if (role === "teacher") return "Teachers";

  if (role === "admin") return "Administrators";

  return role;
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRoleBadgeClasses(role) {
  if (role === "ALL") {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }

  if (role === "student") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (role === "teacher") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";
}

function BellIcon({ className = "h-5 w-5" }) {
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
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 21h4"
      />
    </svg>
  );
}

function PlusIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }) {
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
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EditIcon({ className = "h-4 w-4" }) {
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
        d="M12 20h9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 4-1 1 1-4L16.5 3.5Z"
      />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }) {
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
        d="M4 7h16M10 11v6M14 11v6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 7l1 14h10l1-14M9 7V4h6v3"
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

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-4-4" />
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

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);
  const [showEditModal, setShowEditModal] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getNotifications();

      setNotifications(response?.data || []);
    } catch (err) {
      setError(
        err.message || "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const searchableText = [
        notification.title,
        notification.message,
        notification.targetRole,
        notification.createdBy?.name,
        notification.createdBy?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesRole =
        !roleFilter ||
        notification.targetRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [notifications, searchTerm, roleFilter]);

  const activeNotificationCount = notifications.filter(
    (notification) => notification.isActive !== false
  ).length;

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
  };

  const openCreateModal = () => {
    setForm(INITIAL_FORM);
    setError("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (actionLoading) return;

    setShowCreateModal(false);
    setForm(INITIAL_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      setError("Notification title is required.");
      return false;
    }

    if (!form.message.trim()) {
      setError("Notification message is required.");
      return false;
    }

    if (!form.targetRole) {
      setError("Target role is required.");
      return false;
    }

    return true;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) return;

    try {
      setActionLoading(true);

      await createNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        targetRole: form.targetRole,
      });

      setSuccess("Notification created successfully.");
      setShowCreateModal(false);
      setForm(INITIAL_FORM);

      await fetchNotifications();
    } catch (err) {
      setError(
        err.message || "Failed to create notification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = async (notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true);
    setViewLoading(true);
    setError("");

    try {
      const response = await getNotificationById(
        notification._id
      );

      setSelectedNotification(
        response?.data || notification
      );
    } catch (err) {
      setError(
        err.message || "Failed to load notification details."
      );
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    if (viewLoading) return;

    setShowViewModal(false);
    setSelectedNotification(null);
  };

  const openEditModal = (notification) => {
    setSelectedNotification(notification);

    setForm({
      title: notification.title || "",
      message: notification.message || "",
      targetRole: notification.targetRole || "ALL",
    });

    setError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (actionLoading) return;

    setShowEditModal(false);
    setSelectedNotification(null);
    setForm(INITIAL_FORM);
  };

  const handleEdit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) return;

    if (!selectedNotification?._id) {
      setError("No notification selected.");
      return;
    }

    try {
      setActionLoading(true);

      await updateNotification(
        selectedNotification._id,
        {
          title: form.title.trim(),
          message: form.message.trim(),
          targetRole: form.targetRole,
        }
      );

      setSuccess("Notification updated successfully.");
      setShowEditModal(false);
      setSelectedNotification(null);
      setForm(INITIAL_FORM);

      await fetchNotifications();
    } catch (err) {
      setError(
        err.message || "Failed to update notification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (notification) => {
    setSelectedNotification(notification);
    setError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (actionLoading) return;

    setShowDeleteModal(false);
    setSelectedNotification(null);
  };

  const handleDelete = async () => {
    if (!selectedNotification?._id) {
      setError("No notification selected.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await deleteNotification(selectedNotification._id);

      setSuccess("Notification deleted successfully.");
      setShowDeleteModal(false);
      setSelectedNotification(null);

      await fetchNotifications();
    } catch (err) {
      setError(
        err.message || "Failed to delete notification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="min-h-screen px-4 pb-8 pt-24 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-blue-600">
                Administration
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage announcements for CampusGPT users.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon />
              Create Notification
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertIcon className="mt-0.5 shrink-0" />

              <div className="flex-1">
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-0.5">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                ✓
              </div>

              <span className="font-medium">
                {success}
              </span>
            </div>
          )}

          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Notifications
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {notifications.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BellIcon />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Notifications
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {activeNotificationCount}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Currently Showing
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {filteredNotifications.length}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search notifications..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All target audiences</option>

                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatTargetRole(role)}
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm || roleFilter) && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Notification
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Target Audience
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created By
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                          <p className="mt-3 text-sm text-slate-500">
                            Loading notifications...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredNotifications.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <BellIcon className="h-7 w-7" />
                          </div>

                          <h3 className="mt-4 font-semibold text-slate-900">
                            No notifications found
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Try changing your search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map(
                      (notification) => (
                        <tr
                          key={notification._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <BellIcon className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="max-w-[320px] truncate text-sm font-semibold text-slate-900"
                                  title={notification.title}
                                >
                                  {notification.title ||
                                    "Untitled notification"}
                                </p>

                                <p
                                  className="mt-1 max-w-[320px] truncate text-xs text-slate-500"
                                  title={notification.message}
                                >
                                  {notification.message ||
                                    "No message"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClasses(
                                notification.targetRole
                              )}`}
                            >
                              {formatTargetRole(
                                notification.targetRole
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[150px] truncate text-sm font-medium text-slate-800">
                              {notification.createdBy?.name ||
                                "—"}
                            </p>

                            <p className="max-w-[150px] truncate text-xs text-slate-500">
                              {notification.createdBy?.role ||
                                ""}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              notification.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {notification.isActive === false ? (
                              <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                Inactive
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Active
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openViewModal(notification)
                                }
                                title="View notification"
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                              >
                                <EyeIcon />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(notification)
                                }
                                title="Edit notification"
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                              >
                                <EditIcon />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteModal(notification)
                                }
                                title="Delete notification"
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 lg:hidden">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading notifications...
                  </p>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
                <div className="mx-auto flex max-w-sm flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <BellIcon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    No notifications found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BellIcon />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-bold text-slate-900">
                        {notification.title ||
                          "Untitled notification"}
                      </h3>

                      <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-500">
                        {notification.message ||
                          "No message"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClasses(
                        notification.targetRole
                      )}`}
                    >
                      {formatTargetRole(
                        notification.targetRole
                      )}
                    </span>

                    {notification.isActive === false ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Inactive
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Created By
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-slate-700">
                        {notification.createdBy?.name ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Created
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDate(
                          notification.createdAt
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openViewModal(notification)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <EyeIcon />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(notification)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      <EditIcon />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openDeleteModal(notification)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <TrashIcon />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <NotificationFormModal
          title="Create Notification"
          subtitle="Send an announcement to CampusGPT users."
          form={form}
          onChange={handleFormChange}
          onSubmit={handleCreate}
          onClose={closeCreateModal}
          loading={actionLoading}
          submitText="Create Notification"
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedNotification && (
        <NotificationFormModal
          title="Edit Notification"
          subtitle="Update the selected announcement."
          form={form}
          onChange={handleFormChange}
          onSubmit={handleEdit}
          onClose={closeEditModal}
          loading={actionLoading}
          submitText="Save Changes"
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Notification Details
                </h2>

                <p className="text-xs text-slate-500">
                  Complete announcement information
                </p>
              </div>

              <button
                type="button"
                onClick={closeViewModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {viewLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading notification...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <BellIcon className="h-7 w-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-xl font-bold text-slate-900">
                        {selectedNotification.title ||
                          "Untitled notification"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClasses(
                            selectedNotification.targetRole
                          )}`}
                        >
                          {formatTargetRole(
                            selectedNotification.targetRole
                          )}
                        </span>

                        {selectedNotification.isActive ===
                        false ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Inactive
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Message
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {selectedNotification.message ||
                        "No message available."}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Target Audience"
                      value={formatTargetRole(
                        selectedNotification.targetRole
                      )}
                    />

                    <DetailItem
                      label="Created By"
                      value={
                        selectedNotification.createdBy?.name ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Creator Role"
                      value={
                        selectedNotification.createdBy?.role
                          ? formatTargetRole(
                              selectedNotification
                                .createdBy.role
                            )
                          : "—"
                      }
                    />

                    <DetailItem
                      label="Created"
                      value={formatDateTime(
                        selectedNotification.createdAt
                      )}
                    />

                    <DetailItem
                      label="Last Updated"
                      value={formatDateTime(
                        selectedNotification.updatedAt
                      )}
                    />

                    <DetailItem
                      label="Status"
                      value={
                        selectedNotification.isActive === false
                          ? "Inactive"
                          : "Active"
                      }
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(selectedNotification)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <EditIcon />
                      Edit Notification
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrashIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Delete notification?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to permanently delete{" "}
              <span className="font-semibold text-slate-700">
                {selectedNotification.title ||
                  "this notification"}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {actionLoading
                  ? "Deleting..."
                  : "Delete Notification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationFormModal({
  title,
  subtitle,
  form,
  onChange,
  onSubmit,
  onClose,
  loading,
  submitText,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Enter notification title"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Message <span className="text-red-500">*</span>
              </label>

              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                rows="6"
                placeholder="Write the notification message..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-slate-400">
                This message will be displayed to the selected
                audience.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Target Audience{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="targetRole"
                value={form.targetRole}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatTargetRole(role)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {loading ? "Saving..." : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-medium text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

export default AdminNotifications;