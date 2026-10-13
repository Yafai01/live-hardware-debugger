# Live Hardware Debugger

A browser-based serial monitor, command console and live telemetry dashboard for microcontrollers, built on the Web Serial API.

Live deployment: https://live-hardware-debugger.vercel.app/ (built from the `main` branch)

## What it does

Connect an Arduino, ESP32 or any USB-serial device straight from the browser, with no desktop app or driver install beyond the USB-serial driver itself. The dashboard shows everything the device prints, charts JSON telemetry in real time, plots the raw byte stream and lets you send text or JSON commands back.

## Features

- **Serial connection** over Web Serial with selectable baud rate (9600 to 921600), clean connect/disconnect and clear status reporting (connecting, connected, reconnecting, disconnected).
- **Auto-reconnect** (optional): if the device is unplugged or resets, the app retries for about a minute and reopens the same previously granted port when it reappears.
- **Terminal** with timestamps, colour-coded line types (received text, received JSON, sent, info, OK, error), automatic JSON detection, auto-scroll that pauses when you scroll up, and log download as a `.txt` file. Keeps the most recent 500 lines.
- **Telemetry chart** for `temp`, `volt` and `rpm` values found in JSON lines (aliases `temperature` and `voltage` are accepted). Temperature and voltage share the left axis and RPM has its own right axis. Rolling window of the last 80 samples; missing values appear as gaps, not zeros.
- **Byte oscilloscope** that plots the last 1024 raw bytes received (values 0-255) as a line or points.
- **Command console and macros**: free-form text/JSON commands plus one-click `START`, `STOP`, `STATUS`, `{"ping":true}` and `{"set_rpm":n}`. Optional `STATUS` polling every 2 seconds.
- **Settings panel**: theme, default baud rate, auto-reconnect, STATUS polling, chart smoothing and oscilloscope style, saved in the browser's LocalStorage.
- **Light and dark themes** (light by default).
- **Simulated device**: generates synthetic temperature/voltage/RPM data and answers the macro commands so you can try the UI without hardware. It is labelled "Simulated device" in the header and in the device panel whenever it is active.

## Current limitations

- Web Serial only works in desktop Chromium-based browsers (Chrome, Edge, Opera) and only in a secure context (HTTPS or `localhost`). Firefox, Safari and mobile browsers show a notice and can only use the simulated device.
- Only `temp`, `volt` and `rpm` are charted; other JSON keys are shown in the terminal but not plotted.
- Lines are decoded as UTF-8 and split on newlines. Binary protocols are not decoded (the oscilloscope still shows their bytes).
- The serial connection code is not covered by automated tests (it needs real hardware); parsing, settings and simulator logic are.
- What `START`, `STOP`, `STATUS` and `set_rpm` do is up to your firmware. The example sketches below implement them.

## Tech stack

| Part | Technology |
| --- | --- |
| UI | React 18 |
| Build / dev server | Vite 8 |
| Charts | Chart.js 4 with react-chartjs-2 |
| Device access | Web Serial API |
| Tests | Vitest |
| Lint | ESLint 9 (flat config) with React Hooks rules |
| Hosting | Vercel (static build) |

## Project structure

```
firmware/
  arduino_debug/arduino_debug.ino   Example sketch for AVR Arduino boards
  esp32_debug/esp32_debug.ino       Example sketch for ESP32
public/
  favicon.svg
src/
  main.jsx                Entry point, applies saved theme before first paint
  App.jsx                 Page layout and settings state
  index.css               Design tokens (light/dark) and component styles
  components/
    DevicePanel.jsx       Connect/disconnect, baud rate, Web Serial support notice
    CommandMacros.jsx     Command input, macro buttons, set_rpm
    Terminal.jsx          Log view and download
    LiveChart.jsx         Telemetry chart
    Oscilloscope.jsx      Canvas plot of raw bytes (requestAnimationFrame)
    SettingsPanel.jsx     Settings dialog
    Icons.jsx             Inline SVG icons
  hooks/
    useDevice.js          Connection lifecycle and batched data handling
  lib/
    serial.js             Web Serial connection, read loop, auto-reconnect
    simulator.js          Simulated device
    telemetry.js          Line splitting, JSON parsing, metric extraction
    settings.js           Settings validation and LocalStorage persistence
    __tests__/            Vitest unit tests
```

## Prerequisites

- Node.js 20.19 or newer (required by Vite 8) and npm
- A desktop Chromium-based browser for real hardware
- A device that writes newline-terminated lines over USB serial

## Setup and development

```bash
git clone https://github.com/Yafai01/live-hardware-debugger.git
cd live-hardware-debugger
npm install
npm run dev
```

Open http://localhost:5173, click **Connect serial port** and pick your device, or click **Start simulated device**.

No environment variables are required.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run tests in watch mode |

## Device data format

Send one JSON object per line. Any of these keys are charted:

```json
{"temp": 24.31, "volt": 3.297, "rpm": 3012}
```

Lines that are not JSON are still shown in the terminal. A JSON reply containing `ack` is highlighted as an acknowledgement, and one containing `error` is highlighted as an error.

## Example firmware

Two sketches are included in `firmware/`. Open the folder in the Arduino IDE (each sketch lives in a folder of the same name) and upload it:

- `arduino_debug` for AVR boards: `volt` is a real reading of pin A0 (5 V reference).
- `esp32_debug` for ESP32: `volt` is a real reading of GPIO 34.

In both sketches `temp` and `rpm` are synthetic placeholder values; replace them with your own sensor readings. Both stream at 115200 baud and handle `START`, `STOP`, `STATUS`, `{"ping":true}` and `{"set_rpm":n}`.

## Deployment

The app is a static site. `vercel.json` runs `npm ci` and `npm run build` and serves `dist/`. Any static host works as long as it serves over HTTPS, which Web Serial requires.

## License

No license file is included in this repository. All rights are reserved by the author unless a license is added.
