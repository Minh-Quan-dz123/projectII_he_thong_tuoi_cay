#ifndef BUTTON_H
#define BUTTON_H
#include <Arduino.h>
#include "cac_bien.h"
#include "button.h"
#include "OLED.h"

#define BUTTON_PIN D5
extern bool gan_bam;
//extern unsigned long nhan_start_Time; //ghi lại thời điểm nhấn nút gần nhất


void button_loop();
//void toggle_Oled();

#endif