import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { loadSettings } from "./lib/settings";

// Apply the saved theme before the first paint to avoid a flash.
document.documentElement.dataset.theme = loadSettings().theme;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
