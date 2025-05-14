#include "button.h"
bool gan_bam=false;// đang bấm hay ko
//unsigned long nhan_start_Time=0; //ghi lại thời điểm nhấn nút gần nhất

void button_loop()
{

  // đọc lần đầu tiên nhấn (reading_state sẽ bằng 0) sau đó luôn bằng 1
  int reading_state=digitalRead(BUTTON_PIN);// đọc trạng thái nút không nhấn 1 là, nhấn là 0
  if(gan_bam==true)// đang bấm
  {
    if(reading_state==1)// nếu thả
    {
      gan_bam=false;
      Oled_On=!Oled_On;
      if(Oled_On==false)
      {
        Display_Oled.clearDisplay();// xóa màn hình
        Display_Oled.display();// đây là hàm cập nhật màn hình
      }
    }
  }
  else// ko bấm thì nghe
  {
    if(reading_state==0)
    {
      gan_bam=true;
    }
  }

}


