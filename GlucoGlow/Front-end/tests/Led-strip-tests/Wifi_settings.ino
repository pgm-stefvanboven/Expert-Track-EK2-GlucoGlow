#include <WiFi.h>

const char* ssid = "ANDROID";
const char* password = "bruhhhh1234";

void setup() {
  Serial.begin(115200);

  Serial.println();
  Serial.println("Start");

  WiFi.mode(WIFI_STA);

  Serial.println("Mode OK");

  delay(1000);

  Serial.print("MAC: ");
  Serial.println(WiFi.macAddress());

  Serial.println("Voor WiFi.begin");

  WiFi.begin(ssid, password);

  Serial.println("Na WiFi.begin");

  for (int i = 0; i < 20; i++) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println();
  Serial.print("Status = ");
  Serial.println(WiFi.status());
}

void loop() {}