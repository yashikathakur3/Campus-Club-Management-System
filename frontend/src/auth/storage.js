export const AUTH_STORAGE_KEY = 'campus-club.session.v1';

export function readToken() {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
  } catch {
    // The in-memory session still works for this tab if storage is unavailable.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}
