// ==== /backend/server.js ====

// 1: Import các thư viện cần thiết
const express = require("express"); // Tạo server web
const http = require("http");       // Tạo HTTP server
const { Server } = require("socket.io"); // Tạo server socket.io để giao tiếp realtime với frontend
const mqtt = require("mqtt");       // Kết nối tới HiveMQ qua giao thức MQTT
const cors = require("cors");       // Cho phép các domain khác nhau truy cập API
const apiRoutes = require("./routes");
const authRoutes = require("./authRoutes");

// 2: Tạo ứng dụng Express và HTTP server kèm Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả domain kết nối WebSocket
  }
});
app.use(cors()); // Cho phép các request từ frontend khác port

// 3: Kết nối tới MQTT broker (HiveMQ Cloud)
const mqttClient = mqtt.connect("mqtts://60294ba1a7534e358c2dc4bc7b7cc9f9.s1.eu.hivemq.cloud", {
  username: "esp8266_tuoicay",
  password: "QuanUyenVinh3tuoicay",
  port: 8883,
  rejectUnauthorized: true // Bắt buộc dùng kết nối bảo mật
});

// Biến toàn cục lưu dữ liệu cảm biến mới nhất
let latestSensorData = null;

// 3.1: Khi kết nối MQTT thành công
mqttClient.on('connect', () => {
  console.log('✅ Đã kết nối tới MQTT broker');
  mqttClient.subscribe(['temperature_humidity', 'ON/OFF_Relay'], (err) => {
    if (err) console.error('❌ Lỗi khi đăng ký topic MQTT:', err);
  });
});

// 3.2: Nếu có lỗi trong kết nối MQTT
mqttClient.on("error", (err) => {
  console.error("❌ Lỗi MQTT:", err);
});

// 3.3: Xử lý dữ liệu khi nhận được từ MQTT
mqttClient.on('message', (topic, message) => {
  if (topic === 'temperature_humidity') {
    try {
      const data = JSON.parse(message.toString()); // Chuyển dữ liệu JSON thành object
      latestSensorData = {
        temperature: data.temperature,
        humidity: data.humidity,
        timestamp: new Date()
      };
      console.log('🌡️ Dữ liệu cảm biến:', latestSensorData);

      // Gửi dữ liệu realtime tới tất cả frontend đang kết nối
      io.emit('mqtt-data', latestSensorData);
    } catch (err) {
      console.error('⚠️ Dữ liệu JSON không hợp lệ:', message.toString());
    }
  } else if (topic === 'ON/OFF_Relay') {
    console.log('🔁 Trạng thái bơm nhận được từ MQTT:', message.toString());
  }
});

// 4: Khi có client kết nối đến WebSocket
io.on("connection", (socket) => {
  console.log("🌐 Một client web đã kết nối");

  // 4.1: Gửi dữ liệu cảm biến mới nhất ngay khi client kết nối
  if (latestSensorData) {
    socket.emit('mqtt-data', latestSensorData);
  }

  // 4.2: Khi client gửi yêu cầu bật/tắt bơm
  socket.on('relay-control', (msg) => {
    if (msg === 'ON' || msg === 'OFF') {
      mqttClient.publish('ON/OFF_Relay', msg);
      console.log(`🚰 Đã gửi lệnh bơm: ${msg}`);
    } else {
      console.error('⚠️ Trạng thái relay không hợp lệ:', msg);
    }
  });

  // 4.3: Khi client nhập thời gian tưới cây
  socket.on("set_wateringtime", (value) => {
    if (Number.isInteger(value) && value > 0) {
      mqttClient.publish("set_watering_time", value.toString());
      console.log(`🔁 Đã thiết lập chu kỳ tưới: ${value} giây`);
    } else {
      socket.emit("cycle-error", "⛔ Giá trị chu kỳ tưới phải là số nguyên dương!");
    }
  });

  // 4.4: Khi client nhập điểm tới hạn (mức nước)
  socket.on("set_water_limit", (value) => {
    if (Number.isInteger(value) && value >= 10) {
      mqttClient.publish("set_watering_point", value.toString());
      console.log(`💧 Đã gửi điểm tới hạn: ${value}`);
    } else {
      socket.emit("water-limit-error", "⛔ Điểm tới hạn phải là số ≥ 10!");
    }
  });

  // 4.5: Khi client ngắt kết nối
  socket.on('disconnect', () => {
    console.log('🔌 Một client đã ngắt kết nối');
  });
});

// 5: Khởi động server
app.use(express.json());        // Cho phép xử lý JSON body
app.use("/api", apiRoutes);     // API cây, lịch tưới, điều khiển bơm
app.use("/auth", authRoutes);   // Đăng ký, đăng nhập
server.listen(3323, () => {
  console.log("🚀 Backend server đang chạy tại http://localhost:3323");
});
