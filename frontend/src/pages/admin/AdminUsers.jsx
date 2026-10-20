import { useMemo, useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";

import {
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAllDepartments,
} from "../../api/admin";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* =========================================================
     SEARCH & FILTERS
  ========================================================= */

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  /* =========================================================
     ADD USER MODAL
  ========================================================= */

  const [showAddModal, setShowAddModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    studentId: "",
    employeeId: "",
  });

  const [creatingUser, setCreatingUser] = useState(false);

  /* =========================================================
     EDIT USER MODAL
  ========================================================= */

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    role: "student",
    department: "",
    studentId: "",
    employeeId: "",
  });

  const [updatingUser, setUpdatingUser] = useState(false);

  /* =========================================================
     LOAD USERS
  ========================================================= */

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllUsers();

      setUsers(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD DEPARTMENTS
  ========================================================= */

  async function fetchDepartments() {
  try {
    const data = await getAllDepartments();

    setDepartments(data.data || []);
  } catch (err) {
    console.error("Failed to load departments:", err);
  }
}

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  /* =========================================================
     FILTER USERS
  ========================================================= */

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        user.studentId?.toLowerCase().includes(searchValue) ||
        user.employeeId?.toLowerCase().includes(searchValue);

      const matchesRole =
        !roleFilter || user.role === roleFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      const userDepartmentId =
        typeof user.department === "object"
          ? user.department?._id
          : user.department;

      const matchesDepartment =
        !departmentFilter ||
        userDepartmentId === departmentFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesDepartment
      );
    });
  }, [
    users,
    searchTerm,
    roleFilter,
    statusFilter,
    departmentFilter,
  ]);

  /* =========================================================
     SUCCESS MESSAGE
  ========================================================= */

  function showSuccess(message) {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  }

  /* =========================================================
     OPEN ADD USER
  ========================================================= */

  function openAddUserModal() {
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "student",
      department: "",
      studentId: "",
      employeeId: "",
    });

    setShowAddModal(true);
  }

  /* =========================================================
     CREATE USER
  ========================================================= */

  async function handleCreateUser(e) {
    e.preventDefault();

    try {
      setCreatingUser(true);
      setError("");

      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      };

      if (newUser.department) {
        userData.department = newUser.department;
      }

      if (newUser.role === "student" && newUser.studentId) {
        userData.studentId = newUser.studentId;
      }

      if (newUser.role === "teacher" && newUser.employeeId) {
        userData.employeeId = newUser.employeeId;
      }

      await createUser(userData);

      setShowAddModal(false);

      showSuccess("User created successfully.");

      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  }

  /* =========================================================
     OPEN EDIT USER
  ========================================================= */

  function handleEditClick(user) {
    setSelectedUser(user);

    const departmentId =
      typeof user.department === "object"
        ? user.department?._id || ""
        : user.department || "";

    setEditUser({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "student",
      department: departmentId,
      studentId: user.studentId || "",
      employeeId: user.employeeId || "",
    });

    setShowEditModal(true);
  }

  /* =========================================================
     SAVE EDIT USER
     PUT /users/:id
  ========================================================= */

  async function handleUpdateUser(e) {
    e.preventDefault();

    if (!selectedUser?._id) {
      return;
    }

    try {
      setUpdatingUser(true);
      setError("");

      const userData = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
      };

      if (editUser.department) {
        userData.department = editUser.department;
      } else {
        userData.department = null;
      }

      if (editUser.role === "student") {
        userData.studentId = editUser.studentId || "";
      }

      if (editUser.role === "teacher") {
        userData.employeeId = editUser.employeeId || "";
      }

      await updateUser(selectedUser._id, userData);

      setShowEditModal(false);
      setSelectedUser(null);

      showSuccess("User updated successfully.");

      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setUpdatingUser(false);
    }
  }

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  async function handleStatusChange(user) {
    const action = user.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await updateUserStatus(user._id, !user.isActive);

      showSuccess(
        `User ${user.isActive ? "deactivated" : "activated"} successfully.`
      );

      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to update user status");
    }
  }

  /* =========================================================
     DELETE USER
  ========================================================= */

  async function handleDeleteUser(user) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteUser(user._id);

      showSuccess("User deleted successfully.");

      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  }

  /* =========================================================
     GET USER ID
  ========================================================= */

  function getUserIdentification(user) {
    if (user.role === "student") {
      return user.studentId || "—";
    }

    if (user.role === "teacher") {
      return user.employeeId || "—";
    }

    return "—";
  }

  /* =========================================================
     GET DEPARTMENT NAME
  ========================================================= */

  function getDepartmentName(user) {
    if (!user.department) {
      return "—";
    }

    if (typeof user.department === "object") {
      return user.department.name || "—";
    }

    const department = departments.find(
      (item) => item._id === user.department
    );

    return department?.name || "—";
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090b10]">
      <AdminSidebar />

      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-white/[0.06] dark:bg-[#0d1017] lg:px-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                User Management
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage student, teacher, and administrator accounts.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.location.href = "/admin/bulk-registration"}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.1] dark:text-slate-300 dark:hover:bg-white/[0.05]"
              >
                Bulk Registration
              </button>

              <button
                type="button"
                onClick={openAddUserModal}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                + Add User
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">

            {/* SUCCESS */}

            {successMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                {successMessage}
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
              <div className="grid gap-5 lg:grid-cols-4">

                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Search Users
                  </label>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    placeholder="Search by name, email, student ID or employee ID"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Role
                  </label>

                  <select
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Department
                  </label>

                  <select
                    value={departmentFilter}
                    onChange={(e) =>
                      setDepartmentFilter(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300"
                  >
                    <option value="">All Departments</option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* =================================================
                USERS TABLE
            ================================================= */}

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-white/[0.06]">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Users
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchUsers}
                  className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Loading users...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">

                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Name
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Email
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Role
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Department
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          ID
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">

                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-10 text-center text-sm text-slate-500"
                          >
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user._id}
                            className="transition hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                              {user.name}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                              {user.email}
                            </td>

                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-white/[0.06] dark:text-slate-300">
                                {user.role}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                              {getDepartmentName(user)}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                              {getUserIdentification(user)}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                  user.isActive
                                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                }`}
                              >
                                {user.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditClick(user)
                                  }
                                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.1] dark:text-slate-300"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(user)
                                  }
                                  className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400"
                                >
                                  {user.isActive
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteUser(user)
                                  }
                                  className="rounded-xl bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                                >
                                  Delete
                                </button>

                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================
          ADD USER MODAL
      ===================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#0d1017]">

            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6 dark:border-white/[0.06]">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Add User
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new user account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-5 p-8"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Account Type
                </label>

                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Full Name
                  </label>

                  <input
                    required
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>

                  <input
                    required
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        email: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      password: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              {newUser.role !== "admin" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Department
                  </label>

                  <select
                    value={newUser.department}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        department: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Select Department</option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newUser.role === "student" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Student ID
                  </label>

                  <input
                    value={newUser.studentId}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        studentId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>
              )}

              {newUser.role === "teacher" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Employee ID
                  </label>

                  <input
                    value={newUser.employeeId}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        employeeId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingUser}
                  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white disabled:opacity-60"
                >
                  {creatingUser
                    ? "Creating..."
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#0d1017]">

            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6 dark:border-white/[0.06]">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Edit User
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update user account information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="text-2xl text-slate-400 transition hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleUpdateUser}
              className="space-y-5 p-8"
            >
              {/* ACCOUNT TYPE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Account Type
                </label>

                <select
                  value={editUser.role}
                  onChange={(e) =>
                    setEditUser({
                      ...editUser,
                      role: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* NAME + EMAIL */}

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>

                  <input
                    required
                    value={editUser.name}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>

                  <input
                    required
                    type="email"
                    value={editUser.email}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        email: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white"
                  />
                </div>
              </div>

              {/* DEPARTMENT */}

              {editUser.role !== "admin" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Department
                  </label>

                  <select
                    value={editUser.department}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        department: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white"
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* STUDENT ID */}

              {editUser.role === "student" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Student ID
                  </label>

                  <input
                    value={editUser.studentId}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        studentId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white"
                  />
                </div>
              )}

              {/* EMPLOYEE ID */}

              {editUser.role === "teacher" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Employee ID
                  </label>

                  <input
                    value={editUser.employeeId}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        employeeId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white"
                  />
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-4 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.1] dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updatingUser}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {updatingUser
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;