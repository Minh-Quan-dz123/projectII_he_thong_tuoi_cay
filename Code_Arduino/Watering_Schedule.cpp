#include "Watering_Schedule.h"

RTC_DS3231 rtc;
Watering_Schedule schedules[20];// khởi tạo mảng lịch có 20 phần tử 
int scheduleCount=0;// số lượng lịch hiện tại là 0
int tro_lich=0;// trỏ vào lịch đang xét để so sánh xem đã tới lịch tưới cây chưa
int lich_da_duyet=0;
DateTime nowT;

// 1 lưu lịch vào trong EEPROM mỗi khi có thay đổi lịch
void saveSchedule()
{
  EEPROM.begin(1024);// khởi tạo EEPROM với 1024 byte
  EEPROM.put(0,scheduleCount);// ghi số lượng lịch vào địa chỉ 0
  for(int i=0;i<scheduleCount;i++)
  {  // đẩy schedules[i] vào EEPROM
    EEPROM.put(sizeof(int)+i*sizeof(Watering_Schedule),schedules[i]);
  }
  EEPROM.commit();
}

// 2 lấy ra từ EEPROM rồi lưu và schedules để làm việc (khi khởi động)
void loadSchedulesFromEEPROM()
{
  EEPROM.begin(1024);
  EEPROM.get(0,scheduleCount);// lấy ra số lượng lịch
  for(int i=0;i<scheduleCount;i++)
  { // lấy từ EEPROM và lưu vào schedules[i];
    EEPROM.get(sizeof(int)+i*sizeof(Watering_Schedule),schedules[i]);
  }
}

// 3 so sánh xem lịch hiện tại(schedule1) đã đến thời điểm tưới cây chưa không (thứ, giờ, phút, giây)
int soSanh(Watering_Schedule schedule1, byte thu2, byte gio2, byte phut2,byte giay2)
{
  if(schedule1.thu>thu2) return 1; // đang chưa tới
  else if(schedule1.thu<thu2) return -1;// đã qua rồi
  else // nếu bằng thu
  {
    if(schedule1.gio>gio2) return 1;
    else if(schedule1.gio<gio2) return -1;
    else // nếu bằng giờ
    {
      if(schedule1.phut>phut2) return 1;
      else if(schedule1.phut<phut2) return -1;
      else// nếu bằng giây
      {
        if(schedule1.giay>giay2) return 1;
        else if(schedule1.giay<giay2) return -1;
        else return 0;// bằng nhau hết
      }
    }
  }
}



// 4 thêm 1 lịch trong struct khi thêm 1 lịch mới
void AddSchedule(Watering_Schedule new_Schedule, int index)
{
  // nếu chưa có lịch nào
  if(scheduleCount==0)
  {
    scheduleCount++;
    schedules[0]=new_Schedule;
  }

  else //trước đó đã có lịch
  {
    if(index>scheduleCount) return;// nếu index lỗi vị trí

    if(scheduleCount<20) scheduleCount++;// ví dụ có 6 lịch (0->5) thì tăng thành 7 lịch (0->6): 
    for(int i=scheduleCount-1; i>index;i--) schedules[i]=schedules[i-1];// dịch lịch sang phải
    
    // gán lịch mới vào vị trí x;
    schedules[index]=new_Schedule;

  }

// lưu, xử lý các biến và debug
    saveSchedule();//lưu vào EEPROM
  // đặt lại con trỏ lịch
    nowT=rtc.now();// lấy thời gian hiện tại từ DS3231
    tro_lich=0;
    lich_da_duyet=0;
    while(soSanh(schedules[tro_lich],nowT.dayOfTheWeek(),nowT.hour(),nowT.minute(),nowT.second())==-1)// di chuyển tới lịch lớn hơn gần nhất
    {
      tro_lich++;
      lich_da_duyet++;
      if(tro_lich>=scheduleCount) {tro_lich=0; break;}
    }

    Serial.printf("scheduleCount = %d\n", scheduleCount);
    Serial.printf("tro_lich = %d\n", tro_lich);
    Serial.printf("lich_da_duyet = %d\n", lich_da_duyet);
  // in ra để debug
    for(int i=0;i<scheduleCount;i++)
    {
      Serial.println();
      Serial.printf("%d : %d %d %d %d",(i+1), schedules[i].thu, schedules[i].gio, schedules[i].phut,schedules[i].giay);
    }
    Serial.println();
}


// 5 xóa lịch ở vị trí index
void deleteSchedule(int index)
{
  if(index >= scheduleCount) return;// nếu bị lỗi chỉ số
  if(index == -1) // xóa hết lịch
  {
    scheduleCount=0;
    tro_lich=0;
    lich_da_duyet=0;
  }
  
  else 
  {
    for(int i=index;i<scheduleCount-1;i++) schedules[i]=schedules[i+1];
    scheduleCount--;

    // đặt lại con trỏ lịch
    nowT=rtc.now();// lấy thời gian hiện tại từ DS3231
    tro_lich=0;
    lich_da_duyet=0;
    while(soSanh(schedules[tro_lich],nowT.dayOfTheWeek(),nowT.hour(),nowT.minute(),nowT.second())==-1)// di chuyển tới lịch lớn hơn gần nhất
    {
      tro_lich++;
      lich_da_duyet++;
      if(tro_lich>=scheduleCount) {tro_lich=0; break;}
    }
  }
  
// lưu, xử lý các biến và debug
    saveSchedule();// lưu 
    Serial.printf("scheduleCount = %d\n", scheduleCount);
    Serial.printf("tro_lich = %d\n", tro_lich);
    Serial.printf("lich_da_duyet = %d\n", lich_da_duyet);
  // in ra để debug
    for(int i=0;i<scheduleCount;i++)
    {
      Serial.println();
      Serial.printf("%d : %d %d %d %d",(i+1), schedules[i].thu, schedules[i].gio, schedules[i].phut,schedules[i].giay);
    }
    Serial.println();

}



