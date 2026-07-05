/**
 * Thin fetch wrapper around the backend API.
 *
 * The base URL comes from Vite's env (VITE_API_BASE_URL). Only VITE_-prefixed vars
 * are exposed to the browser, so no server secret can leak here.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * GET a JSON resource from the API.
 * @param {string} path - Path beginning with "/", e.g. "/api/health".
 * @param {RequestInit} [options] - Optional fetch options.
 * @returns {Promise<any>} Parsed JSON response body.
 * @throws {Error} If the response status is not ok.
 */
export async function getJson(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export { API_BASE_URL };
