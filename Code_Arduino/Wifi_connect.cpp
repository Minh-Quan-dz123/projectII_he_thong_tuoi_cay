#include "Wifi_connect.h"
#include <Arduino.h>
/*
const char* ssid = "KhanhHuyen";  // Đổi thành tên WiFi của bạn
const char* password = "23272004";  // Đổi thành mật khẩu WiFi của bạn
*/
void wifi_set()
{
    WiFi.mode(WIFI_STA);// đặt ở chế độ chỉ kết nối, ko phát wifi(WiFi_AP)

    Serial.println("\nbat dau ket noi wifi...");
    //WiFi.begin(ssid,password); // dành cho kết nối cố định
    WiFi.beginSmartConfig(); // bắt đầu chế độ nghe lén thông tin wifi từ điện thoại (thế giới bên ngooài)
    Serial.print("dang ket noi wifi.1.2.3...");

    // chờ nghe lén SSID và password từ thế giới bên ngoài
    while(!WiFi.smartConfigDone())
    {
        delay(500);
        Serial.print("dang nghe len.....");
    }
    Serial.println("----nghe len thanh cong----\n");

    Serial.println("\n Ket noi WiFi thanh cong!");
    Serial.print(" dia chi IP: ");
    Serial.println(WiFi.localIP()); // In địa chỉ IP của ESP8266 trong mạng wifi đó
}