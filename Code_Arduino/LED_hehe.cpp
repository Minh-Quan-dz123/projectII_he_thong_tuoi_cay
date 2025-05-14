#include "LED_hehe.h"
#include <Arduino.h>

void init_LED_LOW(int chan)
{
    pinMode(chan,OUTPUT); // bật chế độ chân D1 ra đầu ra
    digitalWrite(chan,LOW); // bật chế độ chân D1 mặc định là thấp
}
