// 1: Module DHT22
#include "DHT22_hehe.h" // khai báo thư viện của mình
#define DHT_Ketnoi D2
#define DHT_Type DHT11
DHT dht(DHT_Ketnoi,DHT_Type);// khởi tạo đối tượng

// 2: LED
#include "LED_hehe.h" // khai báo thư viện của mk


// 3: Màn hình OLED
#include "OLED.h"

// 4: Kết nối wifi
#include "Wifi_connect.h"


// 5: kết nối HiveMQ 
#include "MQTT.h"

// 6: các biến
#include "cac_bien.h"
int t_check=millis();
int t_bat=millis();


// 7: button
#include "button.h"

// 8: các hàm xử lý
#include "Watering_Schedule.h"
#include <Wire.h>

void setup()
{

    // khởi tạo ban đầu
    Serial.begin(115200); 
    delay(500);

    // 1: DHT11 begin
    dht.begin(); // cho DHT chạy
    

    // 2: LED begin
    init_LED_LOW(LED);
   

    // 3: Wifi Begin
    wifi_set();
    if(WiFi.status()!=WL_CONNECTED) 
    {
        Serial.print(".1.2.3...");
        wifi_set();
    }
    
  
    // 4: DS3231 giao tiếp I2C
    Wire.begin(D4,D3);// gọi giúp cho cả OLED
    while(!rtc.begin())
    {
      Serial.println("ko tim thay DS3231...");
      delay(500);
    }
    rtc.adjust(DateTime(2025, 5, 8, 12, 30, 40));
    DateTime thunowT=rtc.now();// lấy thời gian hiện tại từ DS3231
    Serial.printf("\n test thu thong tin: %d %d %d\n", thunowT.hour(), thunowT.dayOfTheWeek(), thunowT.second());
    /*
    while(rtc.lostPower())
    {
      Serial.println("het pin...");
      delay(500);
    }*/
    
    
    // 5: Kết nối MQTT với TLS Begin
    espClient.setInsecure(); // Không kiểm tra chứng chỉ SSL
    client.setServer(mqtt_sever, mqtt_port);// kết nối
    client.setCallback(callback);// xử lý tin nhắn
    reconnect();

    // 6: Hiển thị OLED
    OLED_SET();

    // 7: nút nhấn 4 chân
    pinMode(BUTTON_PIN,INPUT_PULLUP); 

    // 8: khi khởi động lại lịch ta cần kiểm tra lịch
    loadSchedulesFromEEPROM();// lấy lịch từ EEPROM
    Serial.printf("scheduleCount = %d\n", scheduleCount);
    for(int i=0;i<scheduleCount;i++)
    {
      Serial.println();
      Serial.printf("%d : %d, %d %d %d",(i+1), schedules[i].thu, schedules[i].gio, schedules[i].phut,schedules[i].giay);
    }
    Serial.println();
}

// check lịch tưới cây đã qua hay chưa
int check;
void checkSchedules()
{
  if(scheduleCount==0) return;
  
  nowT=rtc.now();// lấy thời gian hiện tại từ DS3231
  // nếu nay thứ 3 mà lịch đang so sánh lại là thứ 2 thì tăng tro_lich++;
  check=soSanh(schedules[tro_lich],nowT.dayOfTheWeek(),nowT.hour(),nowT.minute(),nowT.second());
  if(lich_da_duyet!=0 && lich_da_duyet<scheduleCount)// trc đó đã có lịch duyệt rồi
  {
    if(check==-1) 
    {
      tro_lich++; // lịch hiện tại đã trôi qua => trỏ sang lịch tiếp theo
      lich_da_duyet++;
      if(tro_lich>=scheduleCount) tro_lich=0;// đã duyệt hết tất cả các lịch
    }
    else if(check==0) // nếu tới lịch thì tưới cây
    {
      digitalWrite(LED,HIGH);
      t_truocOfLed=millis();
      LedOn=true;
      tro_lich++; // lịch hiện tại đã trôi qua => trỏ sang lịch tiếp theo
      lich_da_duyet++;
      if(tro_lich>=scheduleCount) tro_lich=0;
    }
  // nếu check==1 chưa tới lịch thì đợi
  }
  else// chưa duyệt lịch nào lich_da_duyet = 0 or scheduleCount (đã duyệt hết) thì xử lý kiểu khác 
  {  // tương đương là duyệt lịch đầu tiên
    //if(check==-1 || check==1)// thì tức là chưa tới lịch or lịch đã đi quá xa
    if(check==0)
    {
      digitalWrite(LED,HIGH);
      t_truocOfLed=millis();
      LedOn=true;
      tro_lich++; // lịch hiện tại đã trôi qua => trỏ sang lịch tiếp theo
      lich_da_duyet++;
      if(tro_lich>=scheduleCount) tro_lich=0;
    }
  }

  Serial.printf("time hien tai: %d, %d %d %d\n", nowT.dayOfTheWeek(),nowT.hour(),nowT.minute(),nowT.second());
  
}

void loop()
{
  
   // 1 gửi dữ liệu tới MQTT: cứ 1 giây thì gửi nhiệt độ độ ẩm lên HiveMQ
  if((unsigned long)(millis()-t_check) >=1000)
  {
    t_check=millis();
    do_am=dht.readHumidity();
    nhiet_do=dht.readTemperature();

    if (!isnan(nhiet_do) && !isnan(do_am)) // nếu ko bị lỗi thu dữ liệu thì gửi
    {
      sendData_ToMQTT(nhiet_do, do_am);// gửi lên HiveMQ
    } 
    else 
    {
      Serial.println("Ko nhan dc du lieu tu cam bien DHT.");
      dht.begin(); // cho DHT chạy
    }
  }



  // 2: sau 1 giây thì tính điểm và cập nhiệt nhiệt độ, độ ẩm lên OLED
  if((unsigned long)(millis()-t_bat) >= 1000)// sau 1 giây thì cập nhập biến điểm point or kiểm tra thời gian
  {
    t_bat=millis();
    if(LedOn==false)// nếu cây đang chưa tới
    {
      // 2.1 nếu đang ở chế độ tự động tự nhiên :)) - lịch của ng dùng ko có
      if(scheduleCount==0)
      {
        // 2.1.1 cập nhật điểm
            if(!isnan(nhiet_do) &&! isnan(do_am)) // nếu DHT11 ko lỗi
            {
              if(nhiet_do>33 || do_am<60) // nóng hoặc khô
              {
                point+=2; // thì độ khát nước sẽ tăng gấp đôi
              }
              else {point+=1;} // nếu bình thường thì tăng bình thường
            }
            else {dht.begin(); delay(80);} // nếu DHT11 lỗi cho DHT chạy lại

            Serial.print("point = ");
            Serial.println(point);
          
        // 2.1.2 kiểm tra điểm max
          if(point >= Limit_point) // nếu point đạt tới điêm "độ chịu khát" thì bật máy bơm
          {
            digitalWrite(LED,HIGH);
            t_truocOfLed=millis();
            LedOn=true;
            point=0;
          }
      }

      // 2.2
      else // nếu đang có ít nhất 1 lịch tưới sang thì chuyển sang chế độ schedules
      {
          point=0; // tắt chế độ này đi
          /*
          while(rtc.lostPower()) 
          {
            Serial.println("het pin RTC");
            delay(2000);
          }*/
          // gọi hàm check() là xong
          checkSchedules();

        
      }  
    }
      // 2.3 in ra nhiệt độ, độ ẩm trên OLED
    if(Oled_On==true) OledPrint_Infor(nhiet_do,do_am); // in ra nhiệt độ độ ẩm trên OLED
  }



  // 3: nếu thời gian tưới cây quá watering_time thì tắt
  if(LedOn==true && millis() - t_truocOfLed >= watering_time)
  {
    digitalWrite(LED,LOW);
    LedOn=false;
    point=0;
  }

  

  // 4: kết nối wifi nếu xịt begin
  if (WiFi.status() != WL_CONNECTED) 
  {
      Serial.println("Mat ket noi WiFi! Dang thu ket noi lai...");
      
      WiFi.beginSmartConfig(); // bắt đầu chế độ nghe lén thông tin wifi từ điện thoại (thế giới bên ngooài)
      Serial.print("dang ket noi wifi.1.2.3...");

      // chờ nghe lén SSID và password từ thế giới bên ngoài
      while(!WiFi.smartConfigDone())
      {
          delay(500);
          Serial.print("dang nghe len.....");
      }
      Serial.println("----nghe len thanh cong----\n");
  }

  // 5: MQTT begin
  if(!client.connected())
  {
    reconnect();// gọi hàm kết nối lại
  }
  client.loop(); // duy trì kết nối MQTT

  // 6: button begin // nghe bấm nút
  button_loop();
}

