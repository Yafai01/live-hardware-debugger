// User settings with validation and LocalStorage persistence.

export const SETTINGS_STORAGE_KEY = "lhd.settings.v1";

export const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
export const THEMES = ["light", "dark"];
export const OSC_STYLES = ["line", "points"];

export const DEFAULT_SETTINGS = Object.freeze({
  baudRate: 115200,
  autoReconnect: true,
  theme: "light",
  chartSmoothing: true,
  oscStyle: "line",
  pollStatus: false,
});

/** Returns a complete, valid settings object; unknown or invalid values fall back to defaults. */
export function sanitizeSettings(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const baud = Number(input.baudRate);
  const bool = (key) =>
    typeof input[key] === "boolean" ? input[key] : DEFAULT_SETTINGS[key];

  return {
    baudRate: BAUD_RATES.includes(baud) ? baud : DEFAULT_SETTINGS.baudRate,
    autoReconnect: bool("autoReconnect"),
    theme: THEMES.includes(input.theme) ? input.theme : DEFAULT_SETTINGS.theme,
    chartSmoothing: bool("chartSmoothing"),
    oscStyle: OSC_STYLES.includes(input.oscStyle) ? input.oscStyle : DEFAULT_SETTINGS.oscStyle,
    pollStatus: bool("pollStatus"),
  };
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing localStorage can throw (e.g. blocked site data).
    return null;
  }
}

/** True when settings can actually be written (storage present and not blocked or full). */
export function isStorageAvailable(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    const probe = `${SETTINGS_STORAGE_KEY}.probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(storage = defaultStorage()) {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const stored = storage.getItem(SETTINGS_STORAGE_KEY);
    return sanitizeSettings(stored ? JSON.parse(stored) : null);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Persists settings. Returns true on success, false if storage is unavailable. */
export function saveSettings(settings, storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
    return true;
  } catch {
    return false;
  }
}
