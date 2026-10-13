// Pure helpers for turning raw serial text into log lines and chart data.
// Kept free of browser APIs so they can be unit tested.

/** Metrics the dashboard charts, with the JSON keys accepted for each. */
export const METRICS = [
  { key: "temp", label: "Temperature", unit: "°C", aliases: ["temp", "temperature"] },
  { key: "volt", label: "Voltage", unit: "V", aliases: ["volt", "voltage"] },
  { key: "rpm", label: "RPM", unit: "rpm", aliases: ["rpm"] },
];

/** Maximum characters buffered without a newline before a line is forced out. */
export const MAX_LINE_LENGTH = 4096;

/**
 * Creates a stateful splitter that accepts arbitrary text chunks (as they
 * arrive from a serial port) and returns only complete, non-empty lines.
 * Handles both "\n" and "\r\n" line endings and chunks that split a line.
 */
export function createLineSplitter(maxLineLength = MAX_LINE_LENGTH) {
  let buffer = "";

  return {
    push(chunk) {
      buffer += chunk;
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";

      // Guard against a device that never sends a newline.
      while (buffer.length > maxLineLength) {
        parts.push(buffer.slice(0, maxLineLength));
        buffer = buffer.slice(maxLineLength);
      }

      return parts.map((line) => line.replace(/\r$/, "").trim()).filter(Boolean);
    },
    /** Returns whatever is left in the buffer (e.g. on disconnect). */
    flush() {
      const rest = buffer.trim();
      buffer = "";
      return rest ? [rest] : [];
    },
  };
}

/**
 * Parses a line as a JSON object. Returns the object, or null if the line is
 * not a JSON object (plain text, arrays, numbers and malformed JSON all
 * return null).
 */
export function parseJsonLine(line) {
  if (typeof line !== "string") return null;
  const trimmed = line.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const value = JSON.parse(trimmed);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function toFiniteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Extracts the charted metrics from a parsed JSON object.
 * Returns e.g. { temp: 24.5, volt: null, rpm: 3000 }, or null when the object
 * contains none of the known metrics (so status/ack messages are not charted).
 */
export function extractMetrics(obj) {
  if (!obj || typeof obj !== "object") return null;
  const result = {};
  let found = false;

  for (const metric of METRICS) {
    let value = null;
    for (const alias of metric.aliases) {
      if (alias in obj) {
        value = toFiniteNumber(obj[alias]);
        if (value !== null) break;
      }
    }
    result[metric.key] = value;
    if (value !== null) found = true;
  }

  return found ? result : null;
}

/** Creates an empty rolling series for the charts. */
export function createSeries() {
  const series = { labels: [] };
  for (const metric of METRICS) series[metric.key] = [];
  return series;
}

/**
 * Appends one frame of metrics to a rolling series, keeping at most `max`
 * points. Missing metrics are stored as null (a gap), never as 0.
 * Returns a new object; the input is not mutated.
 */
export function appendFrame(series, label, metrics, max = 80) {
  const next = { labels: [...series.labels, label].slice(-max) };
  for (const metric of METRICS) {
    const value = metrics?.[metric.key] ?? null;
    next[metric.key] = [...(series[metric.key] ?? []), value].slice(-max);
  }
  return next;
}

/** Appends bytes to an oscilloscope sample buffer, keeping the last `max`. */
export function appendSamples(samples, bytes, max = 1024) {
  const incoming = Array.from(bytes ?? []);
  if (incoming.length >= max) return incoming.slice(-max);
  const combined = samples.concat(incoming);
  return combined.length > max ? combined.slice(-max) : combined;
}
