// Web Serial connection with clean open/close, read loop and auto-reconnect.

/** True when the Web Serial API is available (Chromium desktop, secure context). */
export function isWebSerialSupported(nav = globalThis.navigator) {
  return Boolean(nav && "serial" in nav && nav.serial);
}

const RECONNECT_INTERVAL_MS = 2000;
const RECONNECT_MAX_ATTEMPTS = 30;

function samePortInfo(a, b) {
  if (!a || !b) return false;
  if (a.usbVendorId === undefined && a.usbProductId === undefined) return false;
  return a.usbVendorId === b.usbVendorId && a.usbProductId === b.usbProductId;
}

/**
 * Connection to a real serial device.
 *
 * Callbacks:
 *  - onBytes(Uint8Array)     raw bytes as received
 *  - onText(string)          decoded text chunk
 *  - onStatus(status)        "connecting" | "connected" | "reconnecting" | "disconnected"
 *  - onLog(kind, message)    "info" | "error"
 *  - shouldReconnect()       read at disconnect time so the live setting is used
 */
export class SerialConnection {
  constructor({ onBytes, onText, onStatus, onLog, shouldReconnect }) {
    this.onBytes = onBytes;
    this.onText = onText;
    this.onStatus = onStatus;
    this.onLog = onLog;
    this.shouldReconnect = shouldReconnect ?? (() => false);

    this.port = null;
    this.portInfo = null;
    this.baudRate = 115200;
    this.reader = null;
    this.readLoopDone = null;
    this.closing = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.writeChain = Promise.resolve();
  }

  get isOpen() {
    return Boolean(this.port);
  }

  async connect(baudRate) {
    if (!isWebSerialSupported()) throw new Error("Web Serial is not supported in this browser.");
    this.baudRate = baudRate;
    this.onStatus("connecting");
    let port;
    try {
      port = await navigator.serial.requestPort();
    } catch (err) {
      this.onStatus("disconnected");
      // NotFoundError means the user closed the picker without choosing a port.
      if (err?.name === "NotFoundError") {
        this.onLog("info", "No port selected.");
        return;
      }
      throw err;
    }
    this.portInfo = port.getInfo?.() ?? null;
    try {
      await this.open(port);
    } catch (err) {
      this.onStatus("disconnected");
      if (err?.name === "InvalidStateError") {
        throw new Error("Port is already open (another tab or app may be using it).", { cause: err });
      }
      throw err;
    }
  }

  async open(port) {
    this.closing = false;
    await port.open({ baudRate: this.baudRate });
    this.port = port;
    this.reconnectAttempts = 0;
    this.onStatus("connected");
    this.readLoopDone = this.readLoop(port);
  }

  async readLoop(port) {
    const decoder = new TextDecoder();

    while (port.readable && !this.closing) {
      this.reader = port.readable.getReader();
      try {
        for (;;) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value?.length) {
            this.onBytes(value);
            this.onText(decoder.decode(value, { stream: true }));
          }
        }
      } catch (err) {
        // Non-fatal errors (framing, parity, buffer overrun) leave port.readable
        // usable, so the loop picks up a new reader. Fatal errors null it.
        if (!this.closing) this.onLog("error", `Read error: ${err?.message ?? err}`);
      } finally {
        try {
          this.reader?.releaseLock();
        } catch {
          /* already released */
        }
        this.reader = null;
      }
    }

    if (this.closing) return;

    // The device went away (unplugged, reset, driver error).
    try {
      await port.close();
    } catch {
      /* port already unusable */
    }
    if (this.port === port) this.port = null;
    this.onLog("error", "Device disconnected.");
    this.onStatus("disconnected");
    if (this.shouldReconnect()) this.scheduleReconnect();
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      this.onLog("error", "Gave up reconnecting. Connect again manually.");
      this.onStatus("disconnected");
      return;
    }
    this.onStatus("reconnecting");
    this.reconnectTimer = setTimeout(() => this.tryReconnect(), RECONNECT_INTERVAL_MS);
  }

  async tryReconnect() {
    this.reconnectAttempts += 1;
    try {
      // Re-plugged devices can appear as a new SerialPort object, so look the
      // port up again among the ports this site has already been granted.
      const ports = await navigator.serial.getPorts();
      const candidate =
        ports.find((p) => samePortInfo(p.getInfo?.(), this.portInfo)) ??
        (ports.length === 1 ? ports[0] : null);
      if (!candidate) throw new Error("Device not found");
      await this.open(candidate);
      this.onLog("info", "Reconnected.");
    } catch {
      if (!this.closing) this.scheduleReconnect();
    }
  }

  async disconnect() {
    this.closing = true;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;

    const port = this.port;
    try {
      await this.reader?.cancel();
    } catch {
      /* ignore */
    }
    try {
      await this.readLoopDone;
    } catch {
      /* ignore */
    }
    try {
      await this.writeChain;
    } catch {
      /* ignore */
    }
    if (port) {
      try {
        await port.close();
      } catch {
        /* ignore */
      }
    }
    this.port = null;
    this.onStatus("disconnected");
  }

  /** Writes text to the device. Writes are queued so they never overlap. */
  write(text) {
    const run = async () => {
      const port = this.port;
      if (!port?.writable) throw new Error("Port is not open.");
      const writer = port.writable.getWriter();
      try {
        await writer.write(new TextEncoder().encode(text));
      } finally {
        writer.releaseLock();
      }
    };
    const result = this.writeChain.then(run, run);
    this.writeChain = result.catch(() => {});
    return result;
  }
}
