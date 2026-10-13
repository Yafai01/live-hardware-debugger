// Simulated device for trying the dashboard without hardware.
// Everything it produces is synthetic and the UI labels it as simulated.

const INTERVAL_MS = 250;

/**
 * Handles one command line sent to the simulated device and returns the
 * reply line (or null). Mutates `state` ({ running, targetRpm }).
 */
export function simulatorReply(command, state) {
  const cmd = command.trim();
  const upper = cmd.toUpperCase();

  if (upper === "START") {
    state.running = true;
    return JSON.stringify({ ack: "START" });
  }
  if (upper === "STOP") {
    state.running = false;
    return JSON.stringify({ ack: "STOP" });
  }
  if (upper === "STATUS") {
    return JSON.stringify({ status: state.running ? "running" : "stopped", target_rpm: state.targetRpm });
  }
  if (cmd.startsWith("{")) {
    let obj;
    try {
      obj = JSON.parse(cmd);
    } catch {
      return JSON.stringify({ error: "invalid JSON" });
    }
    if (obj && obj.ping) return JSON.stringify({ pong: true });
    if (obj && Number.isFinite(obj.set_rpm) && obj.set_rpm >= 0) {
      state.targetRpm = Math.round(obj.set_rpm);
      return JSON.stringify({ ack: "set_rpm", value: state.targetRpm });
    }
    return JSON.stringify({ error: "unknown command" });
  }
  return JSON.stringify({ error: `unknown command: ${cmd}` });
}

/** Same interface as SerialConnection, backed by a timer instead of hardware. */
export class SimulatedConnection {
  constructor({ onBytes, onText, onStatus, onLog }) {
    this.onBytes = onBytes;
    this.onText = onText;
    this.onStatus = onStatus;
    this.onLog = onLog;
    this.timer = null;
    this.t = 0;
    this.rpm = 3000;
    this.state = { running: true, targetRpm: 3000 };
  }

  get isOpen() {
    return this.timer !== null;
  }

  emit(line) {
    const bytes = new TextEncoder().encode(line + "\n");
    this.onBytes(bytes);
    this.onText(line + "\n");
  }

  tick() {
    if (!this.state.running) return;
    this.t += INTERVAL_MS / 1000;
    const temp = 24 + 2.5 * Math.sin(this.t / 5) + (Math.random() - 0.5) * 0.2;
    const volt = 3.3 + 0.05 * Math.sin(this.t * 1.7) + (Math.random() - 0.5) * 0.02;
    this.rpm += (this.state.targetRpm - this.rpm) * 0.2 + (Math.random() - 0.5) * 40;
    this.emit(
      JSON.stringify({
        temp: Number(temp.toFixed(2)),
        volt: Number(volt.toFixed(3)),
        rpm: Math.round(this.rpm),
      })
    );
  }

  async connect() {
    this.onStatus("connected");
    this.onLog("info", "Simulated device started. Data is synthetic, not from hardware.");
    this.timer = setInterval(() => this.tick(), INTERVAL_MS);
  }

  async disconnect() {
    clearInterval(this.timer);
    this.timer = null;
    this.onStatus("disconnected");
  }

  async write(text) {
    if (!this.isOpen) throw new Error("Port is not open.");
    const reply = simulatorReply(text, this.state);
    if (reply) setTimeout(() => this.isOpen && this.emit(reply), 30);
  }
}
