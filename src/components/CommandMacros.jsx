import { useState } from "react";
import { SendIcon } from "./Icons";

const MACROS = [
  { label: "START", command: "START" },
  { label: "STOP", command: "STOP" },
  { label: "STATUS", command: "STATUS" },
  { label: "JSON ping", command: JSON.stringify({ ping: true }) },
];

export default function CommandMacros({ onSend, disabled }) {
  const [command, setCommand] = useState("");
  const [rpm, setRpm] = useState("3000");
  const rpmValue = Number(rpm);
  const rpmValid = rpm.trim() !== "" && Number.isFinite(rpmValue) && rpmValue >= 0;

  async function submitCommand(e) {
    e.preventDefault();
    if (!command.trim()) return;
    const ok = await onSend(command);
    if (ok) setCommand("");
  }

  function submitRpm(e) {
    e.preventDefault();
    if (rpmValid) onSend(JSON.stringify({ set_rpm: Math.round(rpmValue) }));
  }

  return (
    <section className="card" aria-labelledby="commands-heading">
      <div className="card-header">
        <h2 id="commands-heading">Commands</h2>
      </div>

      <form className="inline-form" onSubmit={submitCommand}>
        <label className="visually-hidden" htmlFor="command-input">
          Command
        </label>
        <input
          id="command-input"
          className="mono"
          placeholder='Text or JSON, e.g. {"led":1}'
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="btn btn-primary" disabled={disabled || !command.trim()}>
          <SendIcon />
          Send
        </button>
      </form>
      <p className="muted small">Each command is sent followed by a newline.</p>

      <h3 className="subheading">Macros</h3>
      <div className="button-row">
        {MACROS.map((m) => (
          <button
            key={m.label}
            type="button"
            className="btn btn-small"
            onClick={() => onSend(m.command)}
            disabled={disabled}
            title={`Send ${m.command}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form className="inline-form" onSubmit={submitRpm}>
        <label className="field-label" htmlFor="rpm-input">
          Set RPM
        </label>
        <input
          id="rpm-input"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={rpm}
          onChange={(e) => setRpm(e.target.value)}
          disabled={disabled}
          aria-invalid={!rpmValid}
        />
        <button type="submit" className="btn btn-small" disabled={disabled || !rpmValid}>
          Send
        </button>
      </form>
      <p className="muted small">
        Sends <code>{`{"set_rpm":${rpmValid ? Math.round(rpmValue) : "…"}}`}</code>. Your firmware
        decides what these commands do.
      </p>
    </section>
  );
}
