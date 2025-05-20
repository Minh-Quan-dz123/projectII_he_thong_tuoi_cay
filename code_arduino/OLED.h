#ifndef OLED_H
#define OLED_H
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "cac_bien.h"
#include "Wifi_connect.h"


extern Adafruit_SSD1306 Display_Oled;

void OLED_SET();
void OledPrint_Infor(float nhiet_do,float do_am);

#endif