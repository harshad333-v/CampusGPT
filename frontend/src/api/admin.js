import { API_BASE_URL } from "./client";

/* =========================================================
   HELPER
========================================================= */

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/* =========================================================
   ADMIN DASHBOARD
   GET /api/v1/dashboard
========================================================= */

async function getAdminDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch admin dashboard data"
    );
  }

  return data;
}

/* =========================================================
   GET ALL USERS
   GET /api/v1/users
========================================================= */

async function getAllUsers() {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }

  return data;
}

/* =========================================================
   GET USER BY ID
   GET /api/v1/users/:id
========================================================= */

async function getUserById(userId) {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user");
  }

  return data;
}

/* =========================================================
   CREATE USER
   POST /api/v1/users
========================================================= */

async function createUser(userData) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create user");
  }

  return data;
}

/* =========================================================
   UPDATE USER
   PUT /api/v1/users/:id

   IMPORTANT:
   isActive is NOT sent here.
   Backend has a separate status endpoint.
========================================================= */

async function updateUser(userId, userData) {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update user");
  }

  return data;
}

/* =========================================================
   UPDATE USER STATUS
   PATCH /api/v1/users/:id/status
========================================================= */

async function updateUserStatus(userId, isActive) {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/status`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        isActive,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update user status"
    );
  }

  return data;
}

/* =========================================================
   DELETE USER
   DELETE /api/v1/users/:id
========================================================= */

async function deleteUser(userId) {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete user");
  }

  return data;
}

/* =========================================================
   GET DEPARTMENTS
   GET /api/v1/departments
========================================================= */

async function getAllDepartments() {
  const response = await fetch(
    `${API_BASE_URL}/departments`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch departments"
    );
  }

  return data;
}

/* =========================================================
   BULK REGISTER USERS
   POST /api/v1/users/bulk

   IMPORTANT:
   Do NOT use Content-Type: application/json here.
   Browser automatically sets multipart/form-data.
========================================================= */

async function bulkRegisterUsers(file) {
  const token = localStorage.getItem("token");

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/users/bulk`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to process bulk registration"
    );
  }

  return data;
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAllDepartments,
  bulkRegisterUsers,
};