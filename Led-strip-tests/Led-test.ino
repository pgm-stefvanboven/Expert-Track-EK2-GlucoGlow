#include <FastLED.h>

#define LED_PIN 13
#define NUM_LEDS 18

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
}

void loop() {

  fill_solid(leds, NUM_LEDS, CRGB::Red);
  FastLED.show();
  delay(1000);

  fill_solid(leds, NUM_LEDS, CRGB::Green);
  FastLED.show();
  delay(1000);

  fill_solid(leds, NUM_LEDS, CRGB::Blue);
  FastLED.show();
  delay(1000);

  fill_solid(leds, NUM_LEDS, CRGB::Yellow);
  FastLED.show();
  delay(1000);

  fill_solid(leds, NUM_LEDS, CRGB::Orange);
  FastLED.show();
  delay(1000);
}