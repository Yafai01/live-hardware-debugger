import { useEffect, useRef } from "react";

function cssVar(el, name, fallback) {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Plots the most recent raw bytes (0-255) received from the device.
 * Samples live in a ref that is updated outside React; a requestAnimationFrame
 * loop redraws whenever the sample version, canvas size, style or theme changes.
 */
export default function Oscilloscope({ samplesRef, style = "line", theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let drawn = { version: -1, width: 0, height: 0, dpr: 0 };

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const { samples, version } = samplesRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (
        drawn.version === version &&
        drawn.width === width &&
        drawn.height === height &&
        drawn.dpr === dpr
      ) {
        return;
      }
      drawn = { version, width, height, dpr };

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = cssVar(canvas, "--scope-bg", "#f8fafc");
      const grid = cssVar(canvas, "--scope-grid", "#e5e7eb");
      const trace = cssVar(canvas, "--accent", "#2563eb");
      const muted = cssVar(canvas, "--text-muted", "#6b7280");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const y = Math.round((i / 4) * height) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let i = 1; i < 8; i++) {
        const x = Math.round((i / 8) * width) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      if (samples.length < 2) {
        ctx.fillStyle = muted;
        ctx.font = "13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Waiting for data…", width / 2, height / 2 + 4);
        return;
      }

      const n = samples.length;
      const pad = 4;
      const toY = (v) => pad + (1 - v / 255) * (height - pad * 2);

      if (style === "points") {
        ctx.fillStyle = trace;
        for (let i = 0; i < n; i++) {
          ctx.fillRect((i / (n - 1)) * width - 1, toY(samples[i]) - 1, 2, 2);
        }
      } else {
        ctx.strokeStyle = trace;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * width;
          const y = toY(samples[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [samplesRef, style, theme]);

  return (
    <section className="card" aria-labelledby="scope-heading">
      <div className="card-header">
        <h2 id="scope-heading">Byte oscilloscope</h2>
        <span className="muted small">Last 1024 raw bytes (0-255)</span>
      </div>
      <canvas
        ref={canvasRef}
        className="scope"
        role="img"
        aria-label="Waveform of the most recent raw bytes received from the device"
      />
    </section>
  );
}
