import React, { useRef, useEffect } from "react";

export default function Oscilloscope({ samples = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const ctx = c.getContext("2d");
    const w = (c.width = c.clientWidth);
    const h = (c.height = c.clientHeight);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#00ff55";
    ctx.beginPath();

    const len = samples.length;
    for (let i = 0; i < len; i++) {
      const x = (i / len) * w;
      const y = h - (samples[i] / 255) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }, [samples]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: 150, borderRadius: 8 }}
    />
  );
}
