import { API_BASE_URL } from "./client";

async function getCurrentUser() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export { getCurrentUser };