#ifndef WATERING_SCHEDULE_H
#define WATERING_SCHEDULE_H

#include <EEPROM.h>// dùng để lưu vĩnh viễn trong vùng nhớ của esp8266
#include <Wire.h>// giao tiếp  I2C
#include <RTClib.h>

extern RTC_DS3231 rtc;// đối tượng đo thời gian thực
extern int tro_lich;// trỏ vào lịch đang xét để so sánh xem đã tới lịch tưới cây chưa

struct Watering_Schedule{
  byte thu, gio, phut, giay;
  Watering_Schedule() {} // Constructor mặc định
  Watering_Schedule(byte t, byte g, byte p, byte s) {
    thu = t;
    gio = g;
    phut = p;
    giay = s;
  }
};

extern DateTime nowT;

extern Watering_Schedule schedules[20];
extern int scheduleCount;

void saveSchedule();// lưu schedule vào vị trí index
void loadSchedulesFromEEPROM();// tải schedule
void AddSchedule(Watering_Schedule new_Schedule, int index);
int soSanh(Watering_Schedule schedule1, byte thu2, byte gio2, byte phut2,byte giay2);
void deleteSchedule(int index);// xóa lịch
//void checkSchedules(int index);// check xem đến giờ tưới cây chưa

#endif
