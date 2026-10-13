import { useEffect, useRef } from "react";
import { DownloadIcon, TrashIcon } from "./Icons";

const KIND_LABEL = {
  rx: "RX",
  "rx-json": "JSON",
  tx: "TX",
  info: "INFO",
  ok: "OK",
  error: "ERR",
};

function formatTime(date) {
  return date.toLocaleTimeString([], { hour12: false });
}

function downloadLog(logs) {
  const text = logs
    .map((l) => `[${l.time.toISOString()}] ${KIND_LABEL[l.kind] ?? l.kind} ${l.text}`)
    .join("\n");
  const blob = new Blob([text + "\n"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `serial-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Terminal({ logs, onClear }) {
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <section className="card terminal-card" aria-labelledby="terminal-heading">
      <div className="card-header">
        <h2 id="terminal-heading">Terminal</h2>
        <span className="muted small">{logs.length} lines</span>
        <div className="spacer" />
        <button
          type="button"
          className="btn btn-small"
          onClick={() => downloadLog(logs)}
          disabled={!logs.length}
        >
          <DownloadIcon />
          Download
        </button>
        <button type="button" className="btn btn-small" onClick={onClear} disabled={!logs.length}>
          <TrashIcon />
          Clear
        </button>
      </div>

      <div
        ref={scrollRef}
        className="terminal"
        onScroll={handleScroll}
        role="log"
        aria-live="off"
        aria-label="Serial output"
        tabIndex={0}
      >
        {logs.length === 0 ? (
          <p className="terminal-empty">
            No output yet. Connect a device or start the simulated device to see data here.
          </p>
        ) : (
          logs.map((l) => (
            <div key={l.id} className={`terminal-line kind-${l.kind}`}>
              <span className="terminal-time">{formatTime(l.time)}</span>
              <span className="terminal-kind">{KIND_LABEL[l.kind] ?? l.kind}</span>
              <span className="terminal-text">{l.text}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
