#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>

#define LED_PIN 13
#define NUM_LEDS 18

CRGB leds[NUM_LEDS];

const char* ssid = "ANDROID";
const char* password = "bruhhhh1234";
const char* apiUrl = "http://10.178.148.212:5000/get_event";

// Non-blocking timer variabelen
unsigned long previousMillis = 0;
const long interval = 500; // Poll elke halve seconde voor real-time reactie!

// Huidige spelstatus (geüpdatet via JSON)
int glucose = -1;
String gameState = "START";
bool isScanned = false; 
bool isQuestActive = false;

void setup() {
  Serial.begin(115200);
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(200); // Zet helderheid
  
  fill_solid(leds, NUM_LEDS, CRGB::Blue); // Blauw tijdens opstarten
  FastLED.show();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println("WiFi verbonden");
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. HAAL DATA OP ZONDER DE LOOP TE BLOKKEREN
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(apiUrl);
      int httpCode = http.GET();

      if (httpCode == 200) {
        DynamicJsonDocument doc(512);
        deserializeJson(doc, http.getString());

        // Update variabelen (Zorg dat je backend deze meestuurt!)
        glucose = doc["glucose"]; 
        gameState = doc["game_state"].as<String>(); 
        isScanned = doc["is_scanned"]; 
        isQuestActive = doc["quest_active"];
      }
      http.end();
    }
  }

  // 2. RENDER DE ANIMATIES GEBASEERD OP GAME STATE
  if (gameState == "START") {
    // Mooi ademend blauw/wit effect voor het startscherm
    breatheEffect(CRGB::DarkBlue);
  } 
  else if (gameState == "END") {
    if (glucose > 0) { // Gewonnen!
      rainbowEffect();
    } else { // Verloren (game over)
      strobeEffect(CRGB::Red, 100);
    }
  }
  else if (isQuestActive) {
    // Pincode of Sensor offline? Laat een waarschuwend looplicht zien
    cylonEffect(CRGB::Yellow);
  }
  else if (gameState == "PLAYING") {
    
    // De belangrijkste fix: is de glucose wel zichtbaar?
    if (!isScanned) {
      // Wachten op scan: Neutraal pulserend licht
      breatheEffect(CRGB::Purple); 
    } 
    else {
      // Waardes matchen nu met je app.js grenzen!
      if (glucose <= 75) {
        // Hypo: Knipper rood als een hartslag (synchroon met je audio!)
        strobeEffect(CRGB::Red, 300);
      } 
      else if (glucose >= 160) {
        // Hyper: Geel / Oranje ademend
        breatheEffect(CRGB::Orange);
      } 
      else {
        // Stabiel: Solide groen
        fill_solid(leds, NUM_LEDS, CRGB::Green);
        FastLED.show();
      }
    }
  }
}

// --- FASTLED ANIMATIE FUNCTIES ---

void breatheEffect(CRGB color) {
  float breath = (exp(sin(millis() / 2000.0 * PI)) - 0.36787944) * 108.0;
  fill_solid(leds, NUM_LEDS, color);
  FastLED.setBrightness(breath);
  FastLED.show();
  FastLED.setBrightness(200); // Reset voor andere functies
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