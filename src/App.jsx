import { useCallback, useEffect, useState } from "react";
import CommandMacros from "./components/CommandMacros";
import DevicePanel from "./components/DevicePanel";
import { MoonIcon, SettingsIcon, SunIcon } from "./components/Icons";
import LiveChart from "./components/LiveChart";
import Oscilloscope from "./components/Oscilloscope";
import SettingsPanel from "./components/SettingsPanel";
import Terminal from "./components/Terminal";
import { useDevice } from "./hooks/useDevice";
import { DEFAULT_SETTINGS, isStorageAvailable, loadSettings, saveSettings } from "./lib/settings";

const STATUS_LABEL = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
  reconnecting: "Reconnecting",
};

export default function App() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [persisted] = useState(() => isStorageAvailable());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const device = useDevice(settings);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.colorScheme = settings.theme;
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const connected = device.status === "connected";

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>Live Hardware Debugger</h1>
          <p className="muted small">Web Serial monitor, command console and telemetry charts</p>
        </div>
        <div className="header-actions">
          <span className={`status-pill status-${device.status}`}>
            <span className="status-dot" aria-hidden="true" />
            {STATUS_LABEL[device.status] ?? device.status}
          </span>
          {device.mode === "simulated" && (
            <span className="badge badge-sim" title="Data is generated in the browser, not read from hardware">
              Simulated device
            </span>
          )}
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => update({ theme: settings.theme === "dark" ? "light" : "dark" })}
            aria-label={settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={settings.theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {settings.theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <main className="layout">
        <div className="sidebar">
          <DevicePanel
            supported={device.supported}
            status={device.status}
            mode={device.mode}
            baudRate={settings.baudRate}
            onBaudRateChange={(baudRate) => update({ baudRate })}
            autoReconnect={settings.autoReconnect}
            onAutoReconnectChange={(autoReconnect) => update({ autoReconnect })}
            onConnect={device.connect}
            onDisconnect={device.disconnect}
          />
          <CommandMacros onSend={device.send} disabled={!connected} />
        </div>

        <div className="content">
          <Terminal logs={device.logs} onClear={device.clearLogs} />
          <div className="viz-grid">
            <LiveChart
              series={device.series}
              smoothing={settings.chartSmoothing}
              theme={settings.theme}
              onClear={device.clearData}
            />
            <Oscilloscope samplesRef={device.oscRef} style={settings.oscStyle} theme={settings.theme} />
          </div>
        </div>
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        onReset={() => setSettings({ ...DEFAULT_SETTINGS })}
        persisted={persisted}
      />
    </div>
  );
}
