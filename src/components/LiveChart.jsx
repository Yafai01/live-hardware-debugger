import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { METRICS } from "../lib/telemetry";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip);

const PALETTE = {
  light: { temp: "#c2410c", volt: "#1d4ed8", rpm: "#0f766e", grid: "#e5e7eb", text: "#4b5563" },
  dark: { temp: "#fb923c", volt: "#60a5fa", rpm: "#2dd4bf", grid: "#2a2f37", text: "#9ca3af" },
};

// RPM is orders of magnitude larger than temperature/voltage, so it gets its own axis.
const AXIS_FOR = { temp: "y", volt: "y", rpm: "y1" };

export default function LiveChart({ series, smoothing, theme, onClear }) {
  const colors = PALETTE[theme] ?? PALETTE.light;
  const hasData = series.labels.length > 0;

  const data = useMemo(
    () => ({
      labels: series.labels,
      // Only plot metrics the device has actually reported.
      datasets: METRICS.filter((m) => series[m.key].some((v) => v !== null)).map((m) => ({
        label: `${m.label} (${m.unit})`,
        data: series[m.key],
        yAxisID: AXIS_FOR[m.key],
        borderColor: colors[m.key],
        backgroundColor: colors[m.key],
        borderWidth: 2,
        pointRadius: 0,
        tension: smoothing ? 0.35 : 0,
        spanGaps: false,
      })),
    }),
    [series, smoothing, colors]
  );

  const options = useMemo(
    () => ({
      animation: false,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          ticks: { color: colors.text, maxTicksLimit: 6, maxRotation: 0 },
          grid: { color: colors.grid },
        },
        y: {
          position: "left",
          title: { display: true, text: "°C / V", color: colors.text },
          ticks: { color: colors.text },
          grid: { color: colors.grid },
        },
        y1: {
          position: "right",
          title: { display: true, text: "RPM", color: colors.text },
          ticks: { color: colors.text },
          grid: { drawOnChartArea: false },
        },
      },
      plugins: {
        legend: { labels: { color: colors.text, boxWidth: 12, boxHeight: 2 } },
      },
    }),
    [colors]
  );

  return (
    <section className="card" aria-labelledby="chart-heading">
      <div className="card-header">
        <h2 id="chart-heading">Telemetry</h2>
        <span className="muted small">Last 80 samples</span>
        <div className="spacer" />
        <button type="button" className="btn btn-small" onClick={onClear} disabled={!hasData}>
          Clear
        </button>
      </div>
      <div className="chart-wrap">
        {hasData ? (
          <Line
            data={data}
            options={options}
            role="img"
            aria-label="Line chart of temperature, voltage and RPM over time"
          />
        ) : (
          <div className="empty-state">
            <p>No telemetry yet.</p>
            <p className="muted small">
              Send JSON lines such as <code>{`{"temp":24.5,"volt":3.31,"rpm":3000}`}</code>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
