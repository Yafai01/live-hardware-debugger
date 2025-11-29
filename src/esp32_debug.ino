#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  delay(2000);
}

void loop() {
  float temp = 30.0 + (esp_random() % 100) / 50.0;
  int rpm = 2800 + (esp_random() % 500);
  Serial.printf("{\"temp\":%.2f,\"rpm\":%d}\n", temp, rpm);
  delay(200);
}
