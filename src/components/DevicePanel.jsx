import { BAUD_RATES } from "../lib/settings";
import { AlertIcon, ChipIcon, PlugIcon, UnplugIcon } from "./Icons";

const STATUS_TEXT = {
  disconnected: "Not connected",
  connecting: "Waiting for port selection…",
  connected: "Connected",
  reconnecting: "Connection lost, trying to reconnect…",
};

export default function DevicePanel({
  supported,
  status,
  mode,
  baudRate,
  onBaudRateChange,
  autoReconnect,
  onAutoReconnectChange,
  onConnect,
  onDisconnect,
}) {
  const idle = status === "disconnected";
  const busy = status === "connecting";

  return (
    <section className="card" aria-labelledby="device-heading">
      <div className="card-header">
        <h2 id="device-heading">Device</h2>
      </div>

      {!supported && (
        <div className="notice notice-warning" role="status">
          <AlertIcon />
          <div>
            <strong>Web Serial is not available in this browser.</strong>
            <p>
              Use a desktop Chromium-based browser (Chrome, Edge or Opera) and open the app over
              HTTPS or <code>localhost</code>. You can still explore the dashboard with the
              simulated device below.
            </p>
          </div>
        </div>
      )}

      <div className="field-row">
        <label className="field">
          <span className="field-label">Baud rate</span>
          <select
            value={baudRate}
            onChange={(e) => onBaudRateChange(Number(e.target.value))}
            disabled={!idle}
          >
            {BAUD_RATES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={autoReconnect}
            onChange={(e) => onAutoReconnectChange(e.target.checked)}
          />
          Auto-reconnect
        </label>
      </div>

      <div className="button-row">
        {idle || busy ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onConnect("serial")}
              disabled={!supported || busy}
            >
              <PlugIcon />
              {busy ? "Connecting…" : "Connect serial port"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onConnect("simulated")}
              disabled={busy}
            >
              <ChipIcon />
              Start simulated device
            </button>
          </>
        ) : (
          <button type="button" className="btn" onClick={onDisconnect}>
            <UnplugIcon />
            {status === "reconnecting" ? "Stop reconnecting" : "Disconnect"}
          </button>
        )}
      </div>

      <p className="muted small" aria-live="polite">
        {STATUS_TEXT[status] ?? status}
        {mode === "simulated" && status === "connected" && " (simulated device, synthetic data)"}
        {mode === "serial" && status === "connected" && ` at ${baudRate} baud`}
      </p>
    </section>
  );
}
