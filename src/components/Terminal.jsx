import React from "react";
import { saveAs } from "file-saver";

export default function Terminal({ lines, onClear }) {
  function download() {
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "log.txt");
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={download}>Download Log</button>
        <button onClick={onClear}>Clear</button>
        <div style={{ flex: 1 }} />
        <small>Logs: {lines.length}</small>
      </div>

      <div
        style={{
          height: 300,
          overflow: "auto",
          background: "#001010",
          color: "#7CFC00",
          padding: 10,
          fontFamily: "monospace",
          borderRadius: 8
        }}
      >
        {lines.map((l, i) => (
          <pre key={i}>{l}</pre>
        ))}
      </div>
    </div>
  );
}
