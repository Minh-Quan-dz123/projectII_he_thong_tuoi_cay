#include "OLED.h"
#include "Watering_Schedule.h"
#include <RTClib.h>

Adafruit_SSD1306 Display_Oled(128,64,&Wire,-1);

void OLED_SET()
{
  // kết nối với OLED
  if(!Display_Oled.begin(SSD1306_SWITCHCAPVCC, 0x3C))
  {
    Serial.println(F("Khong the khoi tao OLED!"));
  }
  else
  {
    Display_Oled.clearDisplay(); //xóa màn hình ban đầu;
    Display_Oled.setTextSize(1); // cài đặt kích thước chữ
    Display_Oled.setTextColor(SSD1306_WHITE);

    Display_Oled.setCursor(1,0); // vị trí bắt đầu chữ 6x8
    Display_Oled.println("Ta Minh Quan");

    Display_Oled.display();
  }
}

int week;/*hour,minute,second;
DateTime OlednowT;*/
void OledPrint_Infor(float nhiet_do,float do_am)
{
    Display_Oled.clearDisplay();

    Display_Oled.setCursor(1,0); // vị trí bắt đầu chữ
    Display_Oled.print("Temperature: ");
    Display_Oled.print(nhiet_do);
    Display_Oled.println("C");

    //Display_Oled.setCursor(1,18);
    Display_Oled.print("Humidity   : ");
    Display_Oled.print(do_am);
    Display_Oled.println("%");

    Display_Oled.print("limited point: ");
    Display_Oled.println(Limit_point);

    Display_Oled.print("watering time: ");
    Display_Oled.println(watering_time/1000);
    
    Display_Oled.println(WiFi.SSID());// in ra tên wifi

    // hiển thị thời gian hiện tại
    //OlednowT=;
    week=rtc.now().dayOfTheWeek()+1;
    if(week==1) week=8;
    Display_Oled.printf("%d, %d : %d : %d", week, rtc.now().hour(), rtc.now().minute(),rtc.now().second());

    Display_Oled.display();
}







