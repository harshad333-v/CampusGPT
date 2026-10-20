import { API_BASE_URL } from "./client";

async function getDashboard() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch dashboard data"
    );
  }

  return data;
}

export { getDashboard };