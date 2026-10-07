export const API_BASE_URL = "/api";

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const session = JSON.parse(localStorage.getItem("session"));

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body !== "string") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem("session");
    // Emit an event so AuthContext can handle logout without hard window reload
    window.dispatchEvent(new Event("auth-unauthorized"));
    throw new Error("Sesión expirada");
  }

  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error(`Error HTTP: ${response.status} sin JSON`);
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `Error HTTP: ${response.status}`);
  }

  return data;
}
