// Arduino example - send JSON lines on Serial
void setup() {
  Serial.begin(115200);
  delay(2000);
}

unsigned long t0 = 0;
void loop() {
  unsigned long t = millis();
  float temp = 24.0 + sin(t/5000.0) * 2.5;
  int rpm = 3000 + (t/10)%500;
  Serial.print("{\"temp\":");
  Serial.print(temp, 2);
  Serial.print(",\"rpm\":");
  Serial.print(rpm);
  Serial.println("}");
  delay(250);
}
