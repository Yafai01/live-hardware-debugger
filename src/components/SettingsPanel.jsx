import { useEffect, useRef } from "react";
import { BAUD_RATES } from "../lib/settings";
import { CloseIcon } from "./Icons";

export default function SettingsPanel({ open, onClose, settings, onChange, onReset, persisted }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const set = (key) => (value) => onChange({ ...settings, [key]: value });

  return (
    <dialog
      ref={dialogRef}
      className="settings-dialog"
      aria-labelledby="settings-heading"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="settings-body">
        <div className="card-header">
          <h2 id="settings-heading">Settings</h2>
          <div className="spacer" />
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close settings">
            <CloseIcon />
          </button>
        </div>

        <fieldset className="settings-group">
          <legend>Appearance</legend>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {["light", "dark"].map((t) => (
              <label key={t} className="segmented-option">
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={settings.theme === t}
                  onChange={() => set("theme")(t)}
                />
                <span>{t === "light" ? "Light" : "Dark"}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Connection</legend>
          <label className="field">
            <span className="field-label">Default baud rate</span>
            <select
              value={settings.baudRate}
              onChange={(e) => set("baudRate")(Number(e.target.value))}
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
              checked={settings.autoReconnect}
              onChange={(e) => set("autoReconnect")(e.target.checked)}
            />
            Auto-reconnect when the device drops
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.pollStatus}
              onChange={(e) => set("pollStatus")(e.target.checked)}
            />
            Send <code>STATUS</code> every 2 seconds while connected
          </label>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Display</legend>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.chartSmoothing}
              onChange={(e) => set("chartSmoothing")(e.target.checked)}
            />
            Smooth chart lines
          </label>
          <label className="field">
            <span className="field-label">Oscilloscope style</span>
            <select value={settings.oscStyle} onChange={(e) => set("oscStyle")(e.target.value)}>
              <option value="line">Line</option>
              <option value="points">Points</option>
            </select>
          </label>
        </fieldset>

        <div className="settings-footer">
          <span className="muted small">
            {persisted
              ? "Saved in this browser (LocalStorage)."
              : "Browser storage is unavailable; settings last for this session only."}
          </span>
          <div className="spacer" />
          <button type="button" className="btn btn-small" onClick={onReset}>
            Reset to defaults
          </button>
        </div>
      </div>
    </dialog>
  );
}
