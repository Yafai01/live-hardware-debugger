import React, { useState, useEffect, useRef } from "react";
import {
  requestSerialPort,
  openPort,
  readFromPort,
  writeToPort,
  closePort,
  getPort
} from "../lib/serial";
import CommandMacros from "./CommandMacros";

export default function DevicePanel({ onLog, onDataObject, onRawLine }) {
  const [baud, setBaud] = useState(115200);
  const [portOpen, setPortOpen] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const reconnectRef = useRef(null);

  async function connect() {
    try {
      const port = await requestSerialPort();
      await openPort(port, { baudRate: Number(baud) });
      setPortOpen(true);
      onLog("Serial connected.");
      startRead(port);
    } catch (err) {
      onLog("Serial error: " + err.message);
    }
  }

  async function startRead(port) {
    await readFromPort(
      port,
      (line) => {
        onRawLine(line);
        onLog("[SERIAL] " + line);

        try {
          const obj = JSON.parse(line);
          onDataObject(obj);
          if (obj.ack) onLog("[OK] Command acknowledged.");
          if (obj.error) onLog("[ERR] " + obj.error);
        } catch {}
      },
      () => {
        onLog("Disconnected.");
        setPortOpen(false);
        if (autoReconnect) {
          onLog("Reconnecting in 2s…");
          reconnectRef.current = setTimeout(() => reconnect(), 2000);
        }
      }
    );
  }

  async function reconnect() {
    try {
      const port = getPort();
      if (!port) return;
      await openPort(port, { baudRate: Number(baud) });
      setPortOpen(true);
      onLog("Reconnected.");
      startRead(port);
    } catch {
      reconnectRef.current = setTimeout(() => reconnect(), 2000);
    }
  }

  async function sendCommand(cmd) {
    try {
      const port = getPort();
      if (!port) return onLog("No port open");
      await writeToPort(port, cmd + "\n");
      onLog("Sent: " + cmd);
    } catch (err) {
      onLog("Send error: " + err.message);
    }
  }

  async function disconnect() {
    await closePort();
    setPortOpen(false);
    onLog("Port closed.");
  }

  useEffect(() => {
    return () => reconnectRef.current && clearTimeout(reconnectRef.current);
  }, []);

  // auto STATUS every 2 seconds
  useEffect(() => {
    let poll;
    if (portOpen) {
      poll = setInterval(() => sendCommand("STATUS"), 2000);
    }
    return () => clearInterval(poll);
  }, [portOpen]);

  return (
    <div style={{ padding: 12, background: "#061620", borderRadius: 8 }}>
      <h3>Device Panel</h3>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={connect} disabled={portOpen}>Connect Serial</button>
        <button onClick={disconnect} disabled={!portOpen}>Disconnect</button>

        <label>
          Baud:
          <select value={baud} onChange={(e) => setBaud(e.target.value)}>
            {[9600, 19200, 38400, 57600, 115200, 230400].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={autoReconnect}
            onChange={(e) => setAutoReconnect(e.target.checked)}
          />
          Auto-reconnect
        </label>
      </div>

      <CommandConsole onSend={sendCommand} />
      <CommandMacros onSend={sendCommand} />
    </div>
  );
}

function CommandConsole({ onSend }) {
  const [cmd, setCmd] = useState("");

  return (
    <div style={{ marginTop: 10 }}>
      <input
        style={{ width: "60%" }}
        placeholder='type command or JSON'
        value={cmd}
        onChange={(e) => setCmd(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (onSend(cmd), setCmd(""))}
      />
      <button onClick={() => (onSend(cmd), setCmd(""))}>Send</button>
      <div style={{ fontSize: 12, marginTop: 5 }}>Tip: press Enter to send</div>
    </div>
  );
}
