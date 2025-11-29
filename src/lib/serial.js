let _reader = null;
let _port = null;
let _keepReading = false;

export async function requestSerialPort(filters = []) {
  _port = await navigator.serial.requestPort({ filters });
  return _port;
}

export async function openPort(port, { baudRate = 115200 } = {}) {
  if (!port) throw new Error("No port provided");
  await port.open({ baudRate });
  _port = port;
}

export function getPort() {
  return _port;
}

export async function closePort() {
  _keepReading = false;

  try {
    if (_reader) {
      await _reader.cancel().catch(() => {});
      _reader.releaseLock();
    }
    if (_port && _port.close) await _port.close();
  } catch {}
  
  _port = null;
  _reader = null;
}

export async function writeToPort(port, data) {
  if (!port || !port.writable) throw new Error("Port not writable");
  const writer = port.writable.getWriter();
  await writer.write(new TextEncoder().encode(data));
  writer.releaseLock();
}

export async function readFromPort(port, onLine, onDisconnected) {
  if (!port) throw new Error("readFromPort requires port");

  _keepReading = true;

  try {
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    _reader = decoder.readable.getReader();

    let buf = "";

    while (_keepReading) {
      const { value, done } = await _reader.read();
      if (done) break;

      buf += value;
      let parts = buf.split("\n");
      buf = parts.pop();

      for (const line of parts) {
        onLine(line.trim());
      }
    }
  } catch (err) {
    onDisconnected && onDisconnected(err);
  } finally {
    try { _reader.releaseLock(); } catch {}
  }
}
