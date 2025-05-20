#ifndef MQTT_H
#define MQTT_H
  #include "cac_bien.h"
  #include <Arduino.h>
  #include <PubSubClient.h>
  #include <ArduinoJson.h>
  #include <ESP8266WiFi.h>
  #include "Watering_Schedule.h"
  #include "Wifi_connect.h"


  extern const char* mqtt_sever;
  extern const int mqtt_port;
  extern const char* mqtt_user;
  extern const char* mqtt_pass;

 /* extern const char* mqtt_topic1;
  extern const char* mqtt_topic2;
  extern const char* mqtt_topic3;
  extern const char* mqtt_topic4;
  extern const char* mqtt_topic5;*/

  extern WiFiClientSecure espClient;
  extern PubSubClient client;

  void callback(char* topic, byte* payload, unsigned int length);
  void reconnect();
  void sendData_ToMQTT(float temperature, float humidity);
#endif