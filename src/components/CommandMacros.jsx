import React, { useState } from "react";

export default function CommandMacros({ onSend }) {
  const [rpm, setRpm] = useState(3000);

  return (
    <div style={{
      marginTop: 15,
      padding: 12,
      background: "#052028",
      borderRadius: 8,
      border: "1px solid #094450"
    }}>
      <h4>Command Macros</h4>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onSend("START")}>START</button>
        <button onClick={() => onSend("STOP")}>STOP</button>
        <button onClick={() => onSend("STATUS")}>STATUS</button>
        <button onClick={() => onSend(JSON.stringify({ ping: true }))}>JSON PING</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Set RPM: </label>
        <input
          type="number"
          value={rpm}
          onChange={(e) => setRpm(e.target.value)}
        />
        <button onClick={() => onSend(JSON.stringify({ set_rpm: Number(rpm) }))}>
          Send
        </button>
      </div>
    </div>
  );
}
