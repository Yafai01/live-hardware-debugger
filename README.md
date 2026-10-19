# Live Hardware Debugger

A browser-based serial monitor and telemetry dashboard for microcontrollers such as Arduino and ESP32. It connects to a device over USB using the Web Serial API, logs every line it receives, parses JSON telemetry into live charts, renders raw bytes as an oscilloscope-style waveform, and lets you send commands back to the device. No desktop software is required.

**Live demo:** https://live-hardware-debugger.vercel.app/

## Features

- **Serial connection** via the Web Serial API with selectable baud rate (9600 to 230400) and optional auto-reconnect.
- **Live terminal** with timestamped log lines, clear, and download-to-file (`log.txt`).
- **JSON telemetry parsing** – lines such as `{"temp": 24.5, "rpm": 3000}` are plotted on a rolling 80-point Chart.js line chart (`temp` and `rpm` series). `ack` and `error` fields are surfaced in the log.
- **Oscilloscope view** – raw serial bytes drawn as a waveform on a canvas.
- **Command console** – send free-form text or JSON commands.
- **Command macros** – one-click `START`, `STOP`, `STATUS`, JSON ping, and `set_rpm`.
- **Status polling** – sends `STATUS` every 2 seconds while connected.
- **Example firmware** for Arduino and ESP32 that streams JSON telemetry (`src/arduino_debug.ino`, `src/esp32_debug.ino`).

## Tech stack

- React 18
- Vite
- Web Serial API
- Chart.js with react-chartjs-2
- file-saver

## Getting started

### Prerequisites

- Node.js (a recent LTS release) and npm
- A Chromium-based browser (Chrome, Edge, Opera) – Web Serial is not available in Firefox or Safari
- A board that prints newline-terminated lines over serial (115200 baud in the examples)

### Install and run

```bash
git clone https://github.com/Yafai01/live-hardware-debugger.git
cd live-hardware-debugger
npm install
npm run dev
```

Open `http://localhost:5173`, click **Connect Serial**, and choose your device. Web Serial requires a secure context (`localhost` or HTTPS).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |

### Device firmware

Flash one of the included sketches, or have your firmware print one JSON object per line:

```cpp
void setup() { Serial.begin(115200); }

void loop() {
  float temp = 24.0 + sin(millis() / 5000.0) * 2.5;
  int rpm = 3000 + (millis() / 10) % 500;
  Serial.print("{\"temp\":"); Serial.print(temp, 2);
  Serial.print(",\"rpm\":");  Serial.print(rpm);
  Serial.println("}");
  delay(250);
}
```

## Project structure

```
src/
  App.jsx                 # Dashboard layout and data flow
  components/
    DevicePanel.jsx       # Connect/disconnect, baud rate, command console
    CommandMacros.jsx     # Preset commands
    Terminal.jsx          # Log view with download/clear
    LiveChart.jsx         # Chart.js telemetry chart
    Oscilloscope.jsx      # Canvas waveform of raw bytes
  lib/
    serial.js             # Web Serial helpers
    usb.js                # WebUSB helpers (not yet wired into the UI)
  arduino_debug.ino       # Example Arduino sketch
  esp32_debug.ino         # Example ESP32 sketch
```

## Author

Yafai ([@Yafai01](https://github.com/Yafai01))
