#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>

#define LED_PIN 13
#define NUM_LEDS 18

CRGB leds[NUM_LEDS];

const char* ssid = "ANDROID";
const char* password = "bruhhhh1234";
const char* apiUrl = "http://172.31.149.212/get_event";

// Non-blocking timer variables
unsigned long previousMillis = 0;
const long interval = 500; // Poll every half second for real-time feedback!

// Current game status (updated via JSON)
int glucose = -1;
String gameState = "START";
bool isScanned = false; 
bool isQuestActive = false;

void setup() {
  Serial.begin(115200);
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(200); // Set brightness
  
  fill_solid(leds, NUM_LEDS, CRGB::Blue); // Blue during startup
  FastLED.show();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println("WiFi verbonden");
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. FETCH DATA WITHOUT BLOCKING THE THREAD
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(apiUrl);
      int httpCode = http.GET();

      if (httpCode == 200) {
        DynamicJsonDocument doc(512);
        deserializeJson(doc, http.getString());

        // Update variables (Make sure your backend sends these!)
        glucose = doc["glucose"]; 
        gameState = doc["game_state"].as<String>(); 
        isScanned = doc["is_scanned"]; 
        isQuestActive = doc["quest_active"];
      }
      http.end();
    }
  }

  // 2. RENDER THE ANIMATIONS BASED ON GAME STATE
  if (gameState == "START") {
    breatheEffect(CRGB::DarkBlue);
  } 
  else if (gameState == "END") {
    if (glucose > 0) { // We won!
      rainbowEffect();
    } else { // Lost (Game Over)
      strobeEffect(CRGB::Red, 100);
    }
  }
  else if (isQuestActive) {
    // PIN or sensor offline? Display a flashing warning light
    cylonEffect(CRGB::Yellow);
  }
  else if (gameState == "PLAYING") {
    
    // Is the glucose visible? 
    if (!isScanned) {
      // Waiting for scan: Neutral pulsating light
      breatheEffect(CRGB::Purple); 
    } 
    else {
      // Values now match the limits in app.js
      if (glucose <= 75) {
        // Hypo: Flashes red like a heartbeat (in sync with the audio)
        strobeEffect(CRGB::Red, 300);
      } 
      else if (glucose >= 160) {
        // Hyper: Orange breathable light
        breatheEffect(CRGB::Orange);
      }
      else {
        // Stable: Solid green
        fill_solid(leds, NUM_LEDS, CRGB::Green);
        FastLED.show();
      }
    }
  }
}

// --- FASTLED ANIMATION FEATURES ---

void breatheEffect(CRGB color) {
  float breath = (exp(sin(millis() / 2000.0 * PI)) - 0.36787944) * 108.0;
  fill_solid(leds, NUM_LEDS, color);
  FastLED.setBrightness(breath);
  FastLED.show();
  FastLED.setBrightness(200); // Reset for Other Functions
}

void strobeEffect(CRGB color, int speedMs) {
  if ((millis() / speedMs) % 2 == 0) {
    fill_solid(leds, NUM_LEDS, color);
  } else {
    fill_solid(leds, NUM_LEDS, CRGB::Black);
  }
  FastLED.show();
}

void rainbowEffect() {
  uint8_t beat = beatsin8(30, 0, 255);
  fill_rainbow(leds, NUM_LEDS, millis() / 10, 255 / NUM_LEDS);
  FastLED.show();
}

void cylonEffect(CRGB color) {
  fadeToBlackBy(leds, NUM_LEDS, 20);
  int pos = beatsin16(60, 0, NUM_LEDS - 1);
  leds[pos] = color;
  FastLED.show();
}