import { useCallback, useEffect, useRef, useState } from "react";
import { SerialConnection, isWebSerialSupported } from "../lib/serial";
import { SimulatedConnection } from "../lib/simulator";
import {
  appendFrame,
  appendSamples,
  createLineSplitter,
  createSeries,
  extractMetrics,
  parseJsonLine,
} from "../lib/telemetry";

const MAX_LOG_ENTRIES = 500;
const MAX_CHART_POINTS = 80;
const MAX_OSC_SAMPLES = 1024;
const FLUSH_MS = 80;
const POLL_INTERVAL_MS = 2000;

function timeLabel(date) {
  return date.toLocaleTimeString([], { hour12: false });
}

/**
 * Owns the active connection (real or simulated) and the data it produces:
 * terminal log, chart series and oscilloscope samples. Incoming data is
 * batched so a chatty device does not trigger a render per line.
 */
export function useDevice(settings) {
  const supported = isWebSerialSupported();
  const [status, setStatus] = useState("disconnected");
  const [mode, setMode] = useState(null); // "serial" | "simulated" | null
  const [logs, setLogs] = useState([]);
  const [series, setSeries] = useState(createSeries);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const connRef = useRef(null);
  const splitterRef = useRef(createLineSplitter());
  const oscRef = useRef({ samples: [], version: 0 });
  const pendingLogs = useRef([]);
  const pendingFrames = useRef([]);
  const flushTimer = useRef(null);
  const nextId = useRef(1);

  const flush = useCallback(() => {
    flushTimer.current = null;
    const logsBatch = pendingLogs.current;
    const framesBatch = pendingFrames.current;
    pendingLogs.current = [];
    pendingFrames.current = [];
    if (logsBatch.length) {
      setLogs((prev) => [...prev, ...logsBatch].slice(-MAX_LOG_ENTRIES));
    }
    if (framesBatch.length) {
      setSeries((prev) =>
        framesBatch.reduce(
          (acc, f) => appendFrame(acc, f.label, f.metrics, MAX_CHART_POINTS),
          prev
        )
      );
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current === null) flushTimer.current = setTimeout(flush, FLUSH_MS);
  }, [flush]);

  const log = useCallback(
    (kind, text) => {
      pendingLogs.current.push({ id: nextId.current++, time: new Date(), kind, text });
      scheduleFlush();
    },
    [scheduleFlush]
  );

  const handleLine = useCallback(
    (line) => {
      const obj = parseJsonLine(line);
      if (!obj) {
        log("rx", line);
        return;
      }
      log("rx-json", line);
      if (obj.ack !== undefined) log("ok", `Acknowledged: ${JSON.stringify(obj.ack)}`);
      if (obj.error !== undefined) log("error", `Device error: ${String(obj.error)}`);
      const metrics = extractMetrics(obj);
      if (metrics) {
        pendingFrames.current.push({ label: timeLabel(new Date()), metrics });
        scheduleFlush();
      }
    },
    [log, scheduleFlush]
  );

  const makeHandlers = useCallback(
    () => ({
      onBytes: (bytes) => {
        const osc = oscRef.current;
        osc.samples = appendSamples(osc.samples, bytes, MAX_OSC_SAMPLES);
        osc.version += 1;
      },
      onText: (text) => splitterRef.current.push(text).forEach(handleLine),
      onStatus: setStatus,
      onLog: log,
      shouldReconnect: () => settingsRef.current.autoReconnect,
    }),
    [handleLine, log]
  );

  const connect = useCallback(
    async (kind) => {
      if (connRef.current?.isOpen) return;
      splitterRef.current = createLineSplitter();
      const conn =
        kind === "simulated"
          ? new SimulatedConnection(makeHandlers())
          : new SerialConnection(makeHandlers());
      connRef.current = conn;
      setMode(kind);
      try {
        await conn.connect(settingsRef.current.baudRate);
        if (kind === "serial" && conn.isOpen) {
          log("info", `Connected at ${settingsRef.current.baudRate} baud.`);
        }
      } catch (err) {
        log("error", `Connection failed: ${err?.message ?? err}`);
        setStatus("disconnected");
      }
    },
    [log, makeHandlers]
  );

  const disconnect = useCallback(async () => {
    const conn = connRef.current;
    if (!conn) return;
    await conn.disconnect();
    log("info", "Disconnected.");
  }, [log]);

  const send = useCallback(
    async (command, { quiet = false } = {}) => {
      const text = command.trim();
      if (!text) return false;
      const conn = connRef.current;
      if (!conn?.isOpen) {
        log("error", "Not connected. Connect a device before sending commands.");
        return false;
      }
      try {
        await conn.write(text + "\n");
        if (!quiet) log("tx", text);
        return true;
      } catch (err) {
        log("error", `Send failed: ${err?.message ?? err}`);
        return false;
      }
    },
    [log]
  );

  // Optional STATUS polling while connected.
  useEffect(() => {
    if (status !== "connected" || !settings.pollStatus) return undefined;
    const id = setInterval(() => send("STATUS"), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, settings.pollStatus, send]);

  // Close the port when the app unmounts.
  useEffect(
    () => () => {
      clearTimeout(flushTimer.current);
      connRef.current?.disconnect();
    },
    []
  );

  const clearLogs = useCallback(() => {
    pendingLogs.current = [];
    setLogs([]);
  }, []);

  const clearData = useCallback(() => {
    pendingFrames.current = [];
    setSeries(createSeries());
    oscRef.current = { samples: [], version: oscRef.current.version + 1 };
  }, []);

  return {
    supported,
    status,
    mode: status === "disconnected" ? null : mode,
    logs,
    series,
    oscRef,
    connect,
    disconnect,
    send,
    clearLogs,
    clearData,
  };
}
