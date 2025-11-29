import React from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function LiveChart({ seriesData, height = 200 }) {
  return (
    <Line
      data={seriesData}
      options={{
        animation: false,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#8aa" } },
          y: { ticks: { color: "#8aa" } }
        },
        plugins: {
          legend: { labels: { color: "#8aa" } }
        }
      }}
      height={height}
    />
  );
}
