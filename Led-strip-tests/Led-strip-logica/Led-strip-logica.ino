#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>

#define LED_PIN 13
#define NUM_LEDS 18

CRGB leds[NUM_LEDS];

const char* ssid = "ANDROID";
const char* password = "bruhhhh1234";

const char* apiUrl =
  "http://10.45.239.212:5000/get_event";

void setup() {

  Serial.begin(115200);

  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);

  fill_solid(leds, NUM_LEDS, CRGB::Black);
  FastLED.show();

  WiFi.begin(ssid, password);

  Serial.print("Verbinden");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println();
  Serial.println("WiFi verbonden");
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;
    http.begin(apiUrl);

    int httpCode = http.GET();

    if (httpCode == 200) {

      String payload = http.getString();

      DynamicJsonDocument doc(512);
      deserializeJson(doc, payload);

      int glucose = doc["glucose"];

      Serial.print("Glucose: ");
      Serial.println(glucose);

      if (glucose < 90) {
        Serial.println("LAAG -> ORANJE");
        fill_solid(leds, NUM_LEDS, CRGB::Orange);
      } 
      
      else if (glucose <= 180) {
        Serial.println("NORMAAL -> GROEN");
        fill_solid(leds, NUM_LEDS, CRGB::Green);
      } 
      
      else {
        Serial.println("HOOG -> ROOD");
        fill_solid(leds, NUM_LEDS, CRGB::Red);
      }

      FastLED.show();
    }

    http.end();
  }

  delay(5000);
}