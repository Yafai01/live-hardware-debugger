import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  isStorageAvailable,
  loadSettings,
  sanitizeSettings,
  saveSettings,
} from "../settings";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const brokenStorage = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
  removeItem() {},
};

describe("sanitizeSettings", () => {
  it("falls back to defaults for invalid values", () => {
    expect(
      sanitizeSettings({ baudRate: 12345, theme: "matrix", autoReconnect: "yes", oscStyle: "bars" })
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid values", () => {
    const s = sanitizeSettings({ baudRate: "9600", theme: "dark", chartSmoothing: false });
    expect(s.baudRate).toBe(9600);
    expect(s.theme).toBe("dark");
    expect(s.chartSmoothing).toBe(false);
  });
});

describe("load/save", () => {
  it("round-trips settings through storage", () => {
    const storage = memoryStorage();
    const settings = { ...DEFAULT_SETTINGS, theme: "dark", baudRate: 57600 };
    expect(saveSettings(settings, storage)).toBe(true);
    expect(loadSettings(storage)).toEqual(settings);
  });

  it("uses defaults for missing or corrupted data", () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(memoryStorage({ [SETTINGS_STORAGE_KEY]: "{not json" }))).toEqual(
      DEFAULT_SETTINGS
    );
  });

  it("degrades gracefully when storage is blocked or absent", () => {
    expect(loadSettings(brokenStorage)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS, brokenStorage)).toBe(false);
    expect(isStorageAvailable(brokenStorage)).toBe(false);
    expect(isStorageAvailable(null)).toBe(false);
    expect(isStorageAvailable(memoryStorage())).toBe(true);
  });
});
