// ==== /backend/server.js ====
/*
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
//const dotenv = require('dotenv');
const mqttService = require('./services/mqttService');
//const db = require('./models/db');
//const userRoutes = require('./controllers/userController');
const pumpRoutes = require('./controllers/pumpController');
const sensorRoutes = require('./controllers/sensorController');
//const scheduleRoutes = require('./controllers/scheduleController');

//dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

//app.use('/api', userRoutes);
app.use('/api', pumpRoutes);
app.use('/api', sensorRoutes);
//app.use('/api', scheduleRoutes);

mqttService.connectMQTT();

// khởi động server
server.listen(3323, () => {
  console.log("Backend server running at http://localhost:3323");
});*/

// backend/server.js

// 1: khai báo thư viện
const express = require("express");// 1.1: thư viện express tạo web server
const http = require("http");      // 1.2: module HTTP của Node.js để tạo server thủ công cùng với express
const { Server } = require("socket.io");// 1.3: lớp server từ thư viện socket.io để tạo giao tiếp giứa backend và frontend
const mqtt = require("mqtt"); // 1.4: import thư viện mqtt để kết nối HiveMQ
const cors = require("cors");// 1.5 để tránh lỗi bảo mật khi frontend và backend chạy trên domain/port khác nhau


//2: thiết lập express + socket.io
const app = express();
const server = http.createServer(app);
// => tạo 1 express add, sau đó tạo server từ nó (để socket.io dùng đc)
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép mọi domain truy cập WebSocket
  }
});
// tạo 1 socket.io server gắn vào HTTP server cho phép mọi địa chỉ IP/frontend kết nối websocket tới

app.use(cors());// cho tất cả request HTTP thông thường


//3: kết nối tới MQTT broker (HiveMQ Cloud)
const mqttClient = mqtt.connect("mqtts://60294ba1a7534e358c2dc4bc7b7cc9f9.s1.eu.hivemq.cloud", {
  username: "esp8266_tuoicay",
  password: "QuanUyenVinh3tuoicay",
  port: 8883,
  rejectUnauthorized: true
});

let latestSensorData = null;

//3.1 khi kết nối thành công với MQTT thì in ra "MQTT connected"
mqttClient.on('connect', () => {
  console.log('MQTT connected');
  mqttClient.subscribe(['temperature_humidity', 'ON/OFF_Relay'], (err) => {
    if (err) console.error('Lỗi khi subscribe:', err);
  });
});

// 3.2: bắt lỗi kết nối MQTT
mqttClient.on("error", (err) => {
  console.error("❌ MQTT connection error:", err);
});

// 3.3: khi nhận dữ liệu từ MQTT
mqttClient.on('message', (topic, message) => {
  if (topic === 'temperature_humidity') {
    try {
      const data = JSON.parse(message.toString());
      latestSensorData = {
        temperature: data.temperature,
        humidity: data.humidity,
        timestamp: new Date()
      };
      console.log('🌡️ Received MQTT:', latestSensorData);
      io.emit('mqtt-data', latestSensorData); // Gửi dữ liệu cho frontend
    } catch (err) {
      console.error('⚠️ Invalid JSON from MQTT:', message.toString());
    }
  } else if (topic === 'ON/OFF_Relay') {
    console.log('Received relay state from MQTT:', message.toString());
  }
});


//4 khi có client web kết nối tới socket.io

//4.1 mỗi khi người dùng truy cập front end qua socket.io thì in ra thông báo
io.on("connection", (socket) => {
  console.log("Web client connected"); // in ra thông báo

  // Gửi dữ liệu cảm biến mới nhất khi client kết nối
  if (latestSensorData) {
    socket.emit('mqtt-data', latestSensorData);
  }

  // 4.1.1 nếu front end bấm sự kiện gửi ON/OFF
  socket.on('relay-control', (msg) => {
    if (msg === 'ON') {
      console.log('Received from web:', msg);
      mqttClient.publish('ON/OFF_Relay', msg);
    } else {
      console.error('Invalid relay state:', msg);
    }
  });

  // 4.1.2 xử lý sự kiện người dùng nhập thời gian tưới cây
  socket.on("set_wateringtime", (cycleValue) => {
    console.log("Received cycle value from frontend:", cycleValue);
  
    // Kiểm tra giá trị là số nguyên dương
    if (Number.isInteger(cycleValue) && cycleValue > 0) {
      // Gửi giá trị đến HiveMQ qua MQTT
      mqttClient.publish("set_watering_time", cycleValue.toString(), (err) => {
        if (err) {
          console.error("❌ Error publishing cycle value to MQTT:", err);
        } else {
          console.log(`✅ Published cycle value ${cycleValue} to MQTT topic 'set_watering_time'`);
        }
      });
    } else {
      console.error("⚠️ Invalid cycle value received:", cycleValue);
      socket.emit("cycle-error", "Giá trị thời gian tưới phải là số nguyên dương!");
    }
  });


  // 4.1.3 Xử lý điểm tới hạn
  socket.on("set_water_limit", (waterLimitValue) => {
    console.log("Received water limit value from frontend:", waterLimitValue);

    if (Number.isInteger(waterLimitValue) && waterLimitValue > 10) {
      mqttClient.publish("set_watering_point", waterLimitValue.toString(), (err) => {
        if (err) {
          console.error("❌ Error publishing water limit value to MQTT:", err);
        } else {
          console.log(`✅ Published water limit value ${waterLimitValue} to MQTT topic 'water-limit'`);
        }
      });
    } else {
      console.error("⚠️ Invalid water limit value received:", waterLimitValue);
      socket.emit("water-limit-error", "Giá trị điểm tới hạn phải là số nguyên dương lớn hơn 10!");
    }
  });


  socket.on('disconnect', () => {
    console.log('Web client disconnected');
  });
});

// khởi động server
server.listen(3323, () => {
  console.log("Backend server running at http://localhost:3323");
});
// server sẽ chạy trên http://localhost:3329 và lăng nghe WebSocket và xử lý*/

