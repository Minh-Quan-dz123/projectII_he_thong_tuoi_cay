#include "MQTT.h"

  const char* mqtt_sever="8c8b67f172b549eba06b16f265f2f580.s1.eu.hivemq.cloud";
  const int mqtt_port=8883;
  const char* mqtt_user="esp8266_tuoicay";
  const char* mqtt_pass="QuanUyenVinh3tuoicay";

  const char* mqtt_topic1="ON/OFF_Relay";// bật máy bơm
  const char* mqtt_topic2="temperature_humidity";
  const char* mqtt_topic3="set_watering_time"; // thời gian tưới cây
  const char* mqtt_topic4="set_watering_point"; // trao đổi độ chịu khát 
  const char* mqtt_topic5="set_scheduleMQ";// cú pháp gửi: {"weekday":5,"hour":18,"minute":34,"second":4,"order":0}
  const char* mqtt_topic6="delete_scheduleMQ";// gửi về vị trí lịch bị xóa
  const char* mqtt_topic7="set_time";// cài lại thời gian cho ds3231

  const char* mqtt_topic8="request_wateringLimited"; // nghe yêu cầu lấy "độ chịu khát hiện tại"
  const char* mqtt_topic9="get_wateringLimited"; // gửi giá trị "độ chịu khát" cho HiveMQ

  const char* mqtt_topic10="request_watering_cycle"; // nghe yêu cầu lấy thời gian tưới cây
  const char* mqtt_topic11="get_watering_cycle"; // gửi giá trị thời gian cho HiveMQ
 

  WiFiClientSecure espClient;
  PubSubClient client(espClient);

// 1: Hàm gửi dữ liệu nhiệt độ độ ẩm lên MQTT
void sendData_ToMQTT(float temperature, float humidity) 
{
  // Tạo chuỗi JSON đúng chuẩn
  String payload = "{\"temperature\": " + String(temperature, 2) + 
                   ", \"humidity\": " + String(humidity, 2) + "}";

  if (client.publish(mqtt_topic2, payload.c_str())) 
  {
    //Serial.println("Send data to MQTT: " + payload);
  } 
  else 
  {
    Serial.println("Failed to send data to MQTT.");
  }
}

// 2: hàm kết nối lại
void reconnect()
{
  while(!client.connected()) // nếu vẫn chưa kết nối
  {
    Serial.print("dang ket noi voi MQTT....");
    String clientId="ESP8266-";
    clientId+=String(random(0xffff),HEX);

    // nếu đến bước này đột nhiên mất kết nối wifi
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
    }

  // kết nối được với..
    if(client.connect(clientId.c_str(),mqtt_user,mqtt_pass))
    {
      Serial.println("ket noi thanh cong");
      if(client.subscribe(mqtt_topic1)){Serial.println("Subscribed to topic1 successfully!");}// đăng ký topic1
      //if(client.subscribe(mqtt_topic2)){Serial.println("Subscribed to topic2 successfully!");}// đăng ký topic2
      if(client.subscribe(mqtt_topic3)){Serial.println("Subscribed to topic3 successfully!");}// đăng ký topic3
      if(client.subscribe(mqtt_topic4)){Serial.println("Subscribed to topic4 successfully!");}// đăng ký topic4
      if(client.subscribe(mqtt_topic5)){Serial.println("Subscribed to topic5 successfully!");}// tương tự
      if(client.subscribe(mqtt_topic6)){Serial.println("Subscribed to topic6 successfully!");}// tương tự
      if(client.subscribe(mqtt_topic7)){Serial.println("Subscribed to topic7 successfully!");}// tương tự
      if(client.subscribe(mqtt_topic8)){Serial.println("Subscribed to topic8 successfully!");}
      //if(client.subscribe(mqtt_topic)){Serial.println("Subscribed to topic8 successfully!");}
      if(client.subscribe(mqtt_topic10)){Serial.println("Subscribed to topic8 successfully!");}
    }
    else // nếu ko kết nối đc
    {
      Serial.print("that bai, ma loi: ");
      Serial.println(client.state()); // lấy mã lỗi nếu kết nối thất bại
      delay(1600);
    }
  }
}

// 3: xử lý tin nhắn từ MQTT
void callback(char* topic, byte* payload, unsigned int length) 
{
  // Kiểm tra xem tin nhắn có độ dài hợp lệ không
  if (length>0) 
  {
    // 1: lấy ra dữ liệu
    char message[length+1];  // Tạo một mảng mới để chứa chuỗi có ký tự kết thúc
    memcpy(message, payload, length);
    message[length]='\0';  // Thêm ký tự kết thúc chuỗi
    String msg = String(message);
    msg.trim();

    Serial.print("da nhan lenh lenh la: <");
    Serial.print(msg);
    Serial.print(">:");
    Serial.println(msg.length());

    // 2.1: nếu là topic 1: ON thì bật đèn
    if (strcmp(topic, mqtt_topic1) == 0) 
    {
      if(msg=="ON" || msg=="on" || msg=="On")
      {
        Serial.println("_____Received 'ON' message from MQTT broker!_____");
        client.publish(mqtt_topic1, "da nhan duoc lenh 'ON' ");
        digitalWrite(LED, HIGH);
        t_truocOfLed = millis();// thiết bị thời gian 3 giây bắt đầu
        LedOn = true;
        point = 0;
      }
      
    }

    // 2.2: topic 2: không có nhận mà chỉ gửi


    // 2.3: nếu là topic 3: thời gian tưới cây 
    else if(strcmp(topic, mqtt_topic3) == 0)
    { 
      Serial.print("Received message from topic set_watering_time of MQTT: ");
      watering_time=(msg.toInt())*1000;
    }


    // 2.4: nếu là topic 4: thay đổi điểm tưới cây
    else if(strcmp(topic, mqtt_topic4) == 0)
    {
      Serial.print("Received message from topic set_watering_point of MQTT: ");
      Limit_point=msg.toInt();
    }

    // 2.5: nếu là topic 5: thêm lịch tưới cây tự động (nhận JSON từ web)
    else if(strcmp(topic, mqtt_topic5) == 0)
    {
      Serial.print("Received JSON schedule from topic5 set_watering_schedule:");
      // lấy ra dữ liệu từ chuỗi JSON
      StaticJsonDocument<150> doc;
      DeserializationError error = deserializeJson(doc, msg);
      if (error) 
      {
        Serial.println("JSON parsing failed topic5!: ");
        return;
      }

      // lưu vào dữ liệu: các dữ liệu đã nhận là "doc["weekday"], doc["hour"], doc["minute"], doc["second"];order
      Watering_Schedule x = Watering_Schedule(
        doc["weekday"].as<byte>(), 
        doc["hour"].as<byte>(), 
        doc["minute"].as<byte>(), 
        doc["second"].as<byte>()
      );
      Serial.print(doc["weekday"].as<byte>()); Serial.print(":");
      Serial.print(doc["hour"].as<byte>()); Serial.print(":");
      Serial.print(doc["minute"].as<byte>()); Serial.print(":");
      Serial.println(doc["second"].as<byte>());

      AddSchedule(x, doc["order"]);
    }
    
    // 2.6: nếu là topic 6: xóa lịch 
    else if(strcmp(topic, mqtt_topic6) == 0)
    {
      deleteSchedule(msg.toInt());
      Serial.print("Received JSON schedule from topic6: delete_schedule: ");
      Serial.println(msg.toInt());
    }

    // 2.7: nếu là topic 7: đặt lại thời gian cho ds3231
    else if(strcmp(topic, mqtt_topic7) == 0)
    {
      StaticJsonDocument<200> doc;
      DeserializationError error=deserializeJson(doc, payload, length); // Parse JSON

      if (error) // nếu lỗi
      {
        Serial.print("JSON parsing failed for topic7: ");
        Serial.println(error.c_str());
        return;
      }
      rtc.adjust(DateTime(doc["year"], doc["month"], doc["day"], doc["hour"], doc["minute"], doc["second"]));
      Serial.print("Received JSON schedule from topic7: set_time:");
      Serial.println(msg);
    }

    // 2.8: nếu là topic 8: yêu cầu lấy giá trị độ chịu khát (Limit_point)
    else if(strcmp(topic, mqtt_topic8) == 0)
    {
      client.publish(mqtt_topic9, String(Limit_point).c_str());
    }

    // 2.9: nếu là topic 10: yêu cầu lấy giá trị thời gian tưới cây hiện tại
    else if(strcmp(topic, mqtt_topic10) == 0)
    {
      client.publish(mqtt_topic11, String(watering_time/1000).c_str());
    }
  } 
  
}