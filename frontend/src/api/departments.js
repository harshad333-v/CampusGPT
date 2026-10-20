import { API_BASE_URL } from "./client";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function getDepartments() {
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
      data.message || "Failed to fetch departments."
    );
  }

  return data;
}

async function getDepartmentById(departmentId) {
  const response = await fetch(
    `${API_BASE_URL}/departments/${departmentId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch department."
    );
  }

  return data;
}

async function createDepartment(departmentData) {
  const response = await fetch(
    `${API_BASE_URL}/departments`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(departmentData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create department."
    );
  }

  return data;
}

export {
  getDepartments,
  getDepartmentById,
  createDepartment,
};