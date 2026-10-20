import { useState } from "react";

import AdminSidebar from "../../components/AdminSidebar";
import { bulkRegisterUsers } from "../../api/admin";

function AdminBulkRegistration() {
  const [bulkFile, setBulkFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [result, setResult] = useState(null);

  /* =========================================================
     FILE SELECT
  ========================================================= */

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setSuccessMessage("");
    setResult(null);

    if (!file) {
      setBulkFile(null);
      return;
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".csv")) {
      setBulkFile(null);

      setError(
        "Please select a CSV file. The current backend bulk registration endpoint expects a CSV upload."
      );

      event.target.value = "";

      return;
    }

    setBulkFile(file);
  }

  /* =========================================================
     DOWNLOAD TEMPLATE
  ========================================================= */

  function downloadTemplate() {
    const csvContent =
      "name,email,role,department,studentId,employeeId\n" +
      "John Student,john@example.com,student,CSE,STU001,\n" +
      "Jane Teacher,jane@example.com,teacher,CSE,,EMP001\n" +
      "Admin User,admin@example.com,admin,,,\n";

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "campusgpt_users_template.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  /* =========================================================
     BULK REGISTRATION
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setResult(null);

    if (!bulkFile) {
      setError("Please select a CSV file first.");
      return;
    }

    try {
      setLoading(true);

      const response = await bulkRegisterUsers(bulkFile);

      setResult(response.data || null);

      setSuccessMessage(
        "Bulk registration processed successfully."
      );
    } catch (err) {
      console.error(
        "Bulk registration error:",
        err
      );

      setError(
        err.message ||
          "Failed to process bulk registration."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     RESET
  ========================================================= */

  function handleReset() {
    if (loading) {
      return;
    }

    setBulkFile(null);
    setError("");
    setSuccessMessage("");
    setResult(null);

    const fileInput =
      document.getElementById(
        "bulk-registration-file"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090b10]">
      {/* =====================================================
          ADMIN SIDEBAR
      ===================================================== */}

      <AdminSidebar />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-white/[0.06] dark:bg-[#0d1017] lg:px-10">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
            Bulk Registration
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create multiple CampusGPT user accounts at once.
          </p>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-5xl">
            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {successMessage && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                {successMessage}
              </div>
            )}

            {/* =================================================
                IMPORT CARD
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
              {/* HEADER */}

              <div className="border-b border-slate-200 px-6 py-6 dark:border-white/[0.06]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Import Users
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Upload a CSV file containing the users you want to register.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#151923] dark:text-slate-200 dark:hover:bg-white/[0.05]"
                  >
                    Download Template
                  </button>
                </div>
              </div>

              {/* FORM */}

              {!result && (
                <form
                  onSubmit={handleSubmit}
                  className="p-6"
                >
                  {/* INSTRUCTIONS */}

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                      Before uploading
                    </h3>

                    <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li>
                        • Use the CampusGPT CSV template.
                      </li>

                      <li>
                        • Do not change the column names.
                      </li>

                      <li>
                        • Students require a student ID.
                      </li>

                      <li>
                        • Teachers require an employee ID.
                      </li>

                      <li>
                        • Administrators do not require a department or ID.
                      </li>
                    </ul>
                  </div>

                  {/* EXPECTED COLUMNS */}

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Required CSV columns
                    </h3>

                    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
                      <table className="w-full min-w-[650px]">
                        <thead className="bg-slate-50 dark:bg-white/[0.02]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Column
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Student
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Teacher
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Admin
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              name
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              Required
                            </td>
                          </tr>

                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              email
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              Required
                            </td>
                          </tr>

                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              role
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              student
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              teacher
                            </td>

                            <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                              admin
                            </td>
                          </tr>

                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              department
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                              —
                            </td>
                          </tr>

                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              studentId
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                              —
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                              —
                            </td>
                          </tr>

                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              employeeId
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                              —
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                              Required
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                              —
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* FILE UPLOAD */}

                  <div className="mt-8">
                    <label
                      htmlFor="bulk-registration-file"
                      className="block text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      CSV File
                    </label>

                    <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400 dark:border-white/[0.1] dark:bg-[#11151e] dark:hover:border-white/[0.2]">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-[#1a1f2b]">
                        📄
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                        {bulkFile
                          ? bulkFile.name
                          : "Choose a CSV file"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        CSV files only
                      </p>

                      <label
                        htmlFor="bulk-registration-file"
                        className="mt-5 inline-flex cursor-pointer rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        Choose File
                      </label>

                      <input
                        id="bulk-registration-file"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={loading}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.05]"
                    >
                      Reset
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !bulkFile}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      {loading
                        ? "Processing..."
                        : "Upload & Register Users"}
                    </button>
                  </div>
                </form>
              )}

              {/* =================================================
                  RESULT
              ================================================= */}

              {result && (
                <div className="p-6">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-500/20 dark:bg-green-500/10">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg dark:bg-green-500/20">
                        ✓
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">
                          Bulk Registration Complete
                        </h2>

                        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                          The backend has finished processing your CSV file.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SUMMARY */}

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#11151e]">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total Rows
                      </p>

                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                        {result.totalRows ?? 0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-500/20 dark:bg-green-500/10">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Successful
                      </p>

                      <p className="mt-2 text-3xl font-semibold text-green-700 dark:text-green-300">
                        {result.successful?.length ?? 0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Failed
                      </p>

                      <p className="mt-2 text-3xl font-semibold text-red-700 dark:text-red-300">
                        {result.failed?.length ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* FAILED RECORDS */}

                  {result.failed?.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Failed Records
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          These records could not be registered.
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-red-200 dark:border-red-500/20">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[650px]">
                            <thead className="bg-red-50 dark:bg-red-500/10">
                              <tr>
                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
                                  Row
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
                                  User
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
                                  Error
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-red-100 dark:divide-red-500/10">
                              {result.failed.map(
                                (item, index) => (
                                  <tr key={index}>
                                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                      {item.row ??
                                        item.rowNumber ??
                                        index + 1}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                      {item.name ||
                                        item.email ||
                                        "Unknown"}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-red-600 dark:text-red-400">
                                      {item.error ||
                                        item.message ||
                                        "Registration failed"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUCCESSFUL RECORDS */}

                  {result.successful?.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Successfully Registered
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          These users were successfully created.
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.06]">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[550px]">
                            <thead className="bg-slate-50 dark:bg-white/[0.02]">
                              <tr>
                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  Name
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  Email
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  Role
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                              {result.successful.map(
                                (item, index) => (
                                  <tr key={index}>
                                    <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                      {item.name ||
                                        "—"}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                                      {item.email ||
                                        "—"}
                                    </td>

                                    <td className="px-5 py-4 text-sm capitalize text-slate-600 dark:text-slate-300">
                                      {item.role ||
                                        "—"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RESULT ACTIONS */}

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      Import Another File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminBulkRegistration;