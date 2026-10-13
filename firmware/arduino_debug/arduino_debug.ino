// Example firmware for Live Hardware Debugger (Arduino Uno/Nano/Mega etc.)
//
// Streams one JSON object per line at 115200 baud:
//   {"temp":24.31,"volt":3.297,"rpm":3012}
// - volt: real reading of analog pin A0 (assumes a 5 V ADC reference).
// - temp and rpm: SYNTHETIC demo values; replace them with your sensors.
//
// Accepts newline-terminated commands: START, STOP, STATUS, {"ping":true},
// {"set_rpm":<n>}. Replies are JSON lines such as {"ack":"START"}.

const float ADC_REFERENCE_V = 5.0;
bool running = true;
long targetRpm = 3000;
String inputLine;

void setup() {
  Serial.begin(115200);
}

void reply(const String &json) {
  Serial.println(json);
}

void handleCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;
  String upper = cmd;
  upper.toUpperCase();

  if (upper == "START") {
    running = true;
    reply("{\"ack\":\"START\"}");
  } else if (upper == "STOP") {
    running = false;
    reply("{\"ack\":\"STOP\"}");
  } else if (upper == "STATUS") {
    reply(String("{\"status\":\"") + (running ? "running" : "stopped") +
          "\",\"target_rpm\":" + targetRpm + "}");
  } else if (cmd.startsWith("{") && cmd.indexOf("\"ping\"") >= 0) {
    reply("{\"pong\":true}");
  } else if (cmd.startsWith("{") && cmd.indexOf("\"set_rpm\"") >= 0) {
    int colon = cmd.indexOf(':', cmd.indexOf("\"set_rpm\""));
    targetRpm = cmd.substring(colon + 1).toInt();
    reply(String("{\"ack\":\"set_rpm\",\"value\":") + targetRpm + "}");
  } else {
    reply("{\"error\":\"unknown command\"}");
  }
}

void readCommands() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n') {
      handleCommand(inputLine);
      inputLine = "";
    } else if (c != '\r' && inputLine.length() < 128) {
      inputLine += c;
    }
  }
}

unsigned long lastSample = 0;

void loop() {
  readCommands();

  unsigned long now = millis();
  if (!running || now - lastSample < 250) return;
  lastSample = now;

  float volt = analogRead(A0) * ADC_REFERENCE_V / 1023.0;
  float temp = 24.0 + sin(now / 5000.0) * 2.5;          // synthetic
  long rpm = targetRpm + (long)((now / 10) % 50) - 25;  // synthetic

  Serial.print("{\"temp\":");
  Serial.print(temp, 2);
  Serial.print(",\"volt\":");
  Serial.print(volt, 3);
  Serial.print(",\"rpm\":");
  Serial.print(rpm);
  Serial.println("}");
}
