import React, { useState, useRef, useCallback } from "react";
import DevicePanel from "./components/DevicePanel";
import Terminal from "./components/Terminal";
import LiveChart from "./components/LiveChart";
import Oscilloscope from "./components/Oscilloscope";

export default function App() {
  const [lines, setLines] = useState([]);
  const [series, setSeries] = useState({
    labels: [],
    datasets: [
      { label: "temp", data: [], borderColor: "#ff7f50", tension: 0.2 },
      { label: "rpm", data: [], borderColor: "#7fffd4", tension: 0.2 }
    ]
  });

  const osc = useRef([]);

  const onLog = (msg) =>
    setLines((s) => [...s.slice(-300), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const onRawLine = (line) => {
    const bytes = Array.from(new TextEncoder().encode(line));
    osc.current = [...osc.current.slice(-500), ...bytes].slice(-1000);
  };

  const onDataObject = (obj) => {
    const t = new Date().toLocaleTimeString();
    const max = 80;

    setSeries((prev) => ({
      labels: [...prev.labels, t].slice(-max),
      datasets: prev.datasets.map((ds) => {
        if (ds.label === "temp")
          return { ...ds, data: [...ds.data, obj.temp ?? 0].slice(-max) };
        if (ds.label === "rpm")
          return { ...ds, data: [...ds.data, obj.rpm ?? 0].slice(-max) };
        return ds;
      })
    }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Live Hardware Debugger Dashboard</h1>

      <DevicePanel
        onLog={onLog}
        onDataObject={onDataObject}
        onRawLine={onRawLine}
      />

      <h3 style={{ marginTop: 20 }}>Live Terminal</h3>
      <Terminal lines={lines} onClear={() => setLines([])} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <div>
          <h3>Realtime Charts</h3>
          <LiveChart seriesData={series} />
        </div>

        <div>
          <h3>Oscilloscope</h3>
          <Oscilloscope samples={osc.current} />
        </div>
      </div>
    </div>
  );
}
