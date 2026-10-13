// Example firmware for Live Hardware Debugger (ESP32, Arduino core)
//
// Streams one JSON object per line at 115200 baud:
//   {"temp":30.12,"volt":1.652,"rpm":2950}
// - volt: real reading of GPIO 34 via analogReadMilliVolts().
// - temp and rpm: SYNTHETIC demo values; replace them with your sensors.
//
// Accepts newline-terminated commands: START, STOP, STATUS, {"ping":true},
// {"set_rpm":<n>}. Replies are JSON lines such as {"ack":"START"}.

#include <Arduino.h>

const int VOLTAGE_PIN = 34;
bool running = true;
long targetRpm = 3000;
String inputLine;
unsigned long lastSample = 0;

void handleCommand(String cmd) {
  cmd.trim();
  if (cmd.isEmpty()) return;
  String upper = cmd;
  upper.toUpperCase();

  if (upper == "START") {
    running = true;
    Serial.println("{\"ack\":\"START\"}");
  } else if (upper == "STOP") {
    running = false;
    Serial.println("{\"ack\":\"STOP\"}");
  } else if (upper == "STATUS") {
    Serial.printf("{\"status\":\"%s\",\"target_rpm\":%ld}\n", running ? "running" : "stopped", targetRpm);
  } else if (cmd.startsWith("{") && cmd.indexOf("\"ping\"") >= 0) {
    Serial.println("{\"pong\":true}");
  } else if (cmd.startsWith("{") && cmd.indexOf("\"set_rpm\"") >= 0) {
    int colon = cmd.indexOf(':', cmd.indexOf("\"set_rpm\""));
    targetRpm = cmd.substring(colon + 1).toInt();
    Serial.printf("{\"ack\":\"set_rpm\",\"value\":%ld}\n", targetRpm);
  } else {
    Serial.println("{\"error\":\"unknown command\"}");
  }
}

void setup() {
  Serial.begin(115200);
}

void loop() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n') {
      handleCommand(inputLine);
      inputLine = "";
    } else if (c != '\r' && inputLine.length() < 128) {
      inputLine += c;
    }
  }

  unsigned long now = millis();
  if (!running || now - lastSample < 200) return;
  lastSample = now;

  float volt = analogReadMilliVolts(VOLTAGE_PIN) / 1000.0f;
  float temp = 30.0f + (esp_random() % 100) / 50.0f;      // synthetic
  long rpm = targetRpm - 250 + (long)(esp_random() % 500); // synthetic

  Serial.printf("{\"temp\":%.2f,\"volt\":%.3f,\"rpm\":%ld}\n", temp, volt, rpm);
}
