#ifndef CAC_BIEN_H
#define CAC_BIEN_H

extern bool LedOn;   // trạng thái vòi
extern unsigned long t_truocOfLed; // thời gian bắt đầu vòi bật
extern int watering_time;  // thời gian tưới nước
extern int point;  // điểm của cảnh báo tưới nước hiện tại
extern int Limit_point;// khi point đạt max thì tự động tưới

extern float do_am;
extern float nhiet_do;

extern bool Oled_On; //trạng thái tắt bật của OLED



#define LED D1

#endif