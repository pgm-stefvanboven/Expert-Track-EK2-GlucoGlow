#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "ANDROID";
const char* password = "bruhhhh1234";

const char* apiUrl =
"http://10.31.194.212:5000/get_event";

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);

  Serial.print("Verbinden");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi verbonden!");
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(apiUrl);

    int httpCode = http.GET();

    if (httpCode == 200) {

      String payload = http.getString();

      Serial.println("JSON ontvangen:");
      Serial.println(payload);

      DynamicJsonDocument doc(512);
      deserializeJson(doc, payload);

      int glucose = doc["glucose"];
      int eventId = doc["currentEvent"];

      Serial.print("Glucose: ");
      Serial.println(glucose);

      Serial.print("Event: ");
      Serial.println(eventId);

    } else {

      Serial.print("HTTP fout: ");
      Serial.println(httpCode);

    }

    http.end();
  }

  delay(5000);
}