// Surface Port / ESP32 Arduino starter. Serial telemetry only; no actuator control.
// Back up the board's existing sketch before uploading this one.
// Select your exact ESP32 board in your programming tool. For native USB boards,
// the board's USB CDC setting may need enabling. USB-UART boards use Serial.

void setup() {
  Serial.begin(115200);
}

void loop() {
  static unsigned long last = 0;
  if (millis() - last < 1000) return;
  last = millis();
  // Repeated identification allows reconnection without requiring a board reset.
  Serial.println("{\"type\":\"hello\",\"protocol\":\"surface-port/1\",\"device\":\"ESP32\",\"firmware\":\"starter-1.0\"}");
  // Real board uptime proves messages are arriving, not that a sensor is fitted.
  Serial.print("{\"type\":\"sensors\",\"values\":[{\"id\":\"board_uptime\",\"value\":");
  Serial.print(millis() / 1000);
  Serial.println(",\"unit\":\"s\"}]}");
  // Add your sensor library, read its value, and include it in the values array.
  // Send one complete array per update (it replaces the previous sensor list).
  // Do not send example or guessed values as real sensor readings.
  // Only send a power packet if your board has a real USB-power sensing circuit.
  // Never connect a vehicle's 12 V signal directly to an ESP32 pin.
}
