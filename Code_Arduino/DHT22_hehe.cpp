#include "DHT22_hehe.h"
#include <Arduino.h>

void check_and_print_dht(float doamkk,float nhietdo)
{
  // kiểm tra doamkk và nhietdo có null ko
  if(isnan(doamkk)|| isnan(nhietdo))
  {
    Serial.println("Cam bien loi");
    return;
  }

  // in ra màn hình
    Serial.print("do am la ");
    Serial.print(doamkk);
    Serial.println("%");

    Serial.print("nhiet do la: ");
    Serial.print(nhietdo);
    Serial.println("C");
    
}