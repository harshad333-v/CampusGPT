import { useEffect, useMemo, useState } from "react";

import AdminSidebar from "../../components/AdminSidebar";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
} from "../../api/departments";

const initialForm = {
  name: "",
  code: "",
  description: "",
};

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AdminDepartments() {
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [selectedDepartment, setSelectedDepartment] =
    useState(null);

  const [formData, setFormData] =
    useState(initialForm);

  async function loadDepartments() {
    try {
      setLoading(true);
      setError("");

      const response = await getDepartments();

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load departments."
        );
      }

      setDepartments(response.data || []);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load departments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return departments;
    }

    return departments.filter((department) => {
      return (
        department.name
          ?.toLowerCase()
          .includes(query) ||
        department.code
          ?.toLowerCase()
          .includes(query) ||
        department.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [departments, search]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setFormData(initialForm);
    setError("");
    setSuccessMessage("");
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (creating) {
      return;
    }

    setShowCreateModal(false);
    setFormData(initialForm);
  }

  async function handleCreateDepartment(event) {
    event.preventDefault();

    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();
    const description =
      formData.description.trim();

    if (!name) {
      setError("Department name is required.");
      return;
    }

    if (!code) {
      setError("Department code is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccessMessage("");

      const response = await createDepartment({
        name,
        code,
        description,
      });

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to create department."
        );
      }

      setSuccessMessage(
        response.message ||
          "Department created successfully."
      );

      setShowCreateModal(false);
      setFormData(initialForm);

      await loadDepartments();
    } catch (err) {
      setError(
        err.message ||
          "Failed to create department."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleViewDetails(departmentId) {
    try {
      setError("");

      const response =
        await getDepartmentById(departmentId);

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load department details."
        );
      }

      setSelectedDepartment(
        response.data || null
      );

      setShowDetailsModal(true);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load department details."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b10]">
      <AdminSidebar />

     <main className="min-h-screen px-4 pb-8 pt-24 sm:px-6 sm:pt-24 lg:ml-64 lg:px-8 lg:pt-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              Departments
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage the academic departments
              available in CampusGPT.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            + Add Department
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {/* Search + Summary */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Search Departments
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, code or description..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Active Departments
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {departments.length}
            </p>
          </div>
        </div>

        {/* Department Content */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-white/10 dark:border-t-blue-500" />

              <p className="text-sm text-slate-600 dark:text-slate-400">
                Loading departments...
              </p>
            </div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-white/[0.06]">
              🏢
            </div>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {departments.length === 0
                ? "No departments found"
                : "No matching departments"}
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {departments.length === 0
                ? "Create your first academic department to get started."
                : "Try changing your search."}
            </p>

            {departments.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                + Add Department
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            {/* Table */}
            <div className="border-b border-slate-200 px-6 py-5 dark:border-white/[0.06]">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Departments
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {filteredDepartments.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {departments.length}
                    </span>{" "}
                    departments
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Department
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Code
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Description
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Created
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDepartments.map(
                    (department) => (
                      <tr
                        key={department._id}
                        className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-white/[0.06]">
                              🏢
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {department.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700 dark:bg-white/[0.06] dark:text-slate-300">
                            {department.code}
                          </span>
                        </td>

                        <td className="max-w-[320px] px-6 py-5">
                          <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                            {department.description ||
                              "No description provided."}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            Active
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(
                            department.createdAt
                          )}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleViewDetails(
                                department._id
                              )
                            }
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0d1017]">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Add Department
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Create a new academic department.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/[0.06]"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateDepartment}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Department Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Computer Science Engineering"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Department Code *
                </label>

                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleFormChange}
                  placeholder="e.g. CSE"
                  maxLength={20}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                />

                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Use a short unique code such as CSE,
                  ECE or ME.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Briefly describe the department..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-xs leading-5 text-blue-700 dark:text-blue-300">
                  New departments are created as
                  active departments automatically.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {creating
                    ? "Creating..."
                    : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Details Modal */}
      {showDetailsModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0d1017]">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-white/[0.06]">
                  🏢
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedDepartment.name}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {selectedDepartment.code}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDepartment(null);
                }}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {selectedDepartment.description ||
                    "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </p>

                  <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedDepartment.isActive
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatDate(
                      selectedDepartment.createdAt
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDepartments;