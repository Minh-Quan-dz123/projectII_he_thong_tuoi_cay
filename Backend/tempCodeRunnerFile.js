// ==== /backend/server.js ====

// 1: Import các thư viện cần thiết
const express = require("express"); // Tạo server web
const http = require("http");       // Tạo HTTP server
const { Server } = require("socket.io"); // Tạo server socket.io để giao tiếp realtime với frontend
const mqtt = require("mqtt");       // Kết nối tới HiveMQ qua giao thức MQTT
const cors = require("cors");       // Cho phép các domain khác nhau truy cập API
const mysql = require("mysql2"); // Thêm thư viện MySQL
//const apiRoutes = require("./routes");
//const authRoutes = require("./authRoutes");

// 2: Tạo ứng dụng Express và HTTP server kèm Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả domain kết nối WebSocket
  }
});
app.use(cors()); // Cho phép các request từ frontend khác port
app.use(express.json());


// 3: Kết nối tới MySQL
const db = mysql.createConnection({
  host: "localhost", // or thay bằng host khác
  user: "root", // or thay bằng user khác
  password: "Taquan2327@ppv", // Thay bằng password của bạn
  database: "wateringschedulemysql" // Thay bằng tên database của bạn
});

db.connect((err) => {
  if (err) {
    console.error("❌ Lỗi kết nối MySQL:", err);
    return;
  }
  console.log("✅ Đã kết nối tới MySQL");
});


// 4: Kết nối tới MQTT broker (HiveMQ Cloud)
const mqttClient = mqtt.connect("mqtts://60294ba1a7534e358c2dc4bc7b7cc9f9.s1.eu.hivemq.cloud", {
  username: "esp8266_tuoicay",
  password: "QuanUyenVinh3tuoicay",
  port: 8883,
  rejectUnauthorized: true 
});

// Biến toàn cục lưu dữ liệu cảm biến mới nhất
let latestSensorData = null;

// 4.1: Khi kết nối MQTT thành công
mqttClient.on('connect', () => {
  console.log('✅ Đã kết nối tới MQTT broker');

  // đăng ký để nhận dữ liệu, nếu chỉ gửi thì dùng publish
  //mqttClient.subscribe(['temperature_humidity', 'ON/OFF_Relay'], (err) => {
    mqttClient.subscribe(['temperature_humidity'], (err) => { 
    if (err) console.error('❌ Lỗi khi đăng ký topic MQTT:', err);
  });
});

// 4.2: Nếu có lỗi trong kết nối MQTT
mqttClient.on("error", (err) => {
  console.error("❌ Lỗi MQTT:", err);
});

// 4.3: Xử lý dữ liệu khi nhận được từ MQTT
mqttClient.on('message', (topic, message) => {
  if (topic === 'temperature_humidity') {// nếu là topic 2: nhận nhiệt độ, độ ẩm
    try {
      const data = JSON.parse(message.toString()); // Chuyển dữ liệu JSON thành object
      latestSensorData = {
        temperature: data.temperature,// nhiệt độ
        humidity: data.humidity, // độ ẩm
        //timestamp: new Date()
      };
      console.log('🌡️ Dữ liệu cảm biến:', latestSensorData);// in ra để check

      // Gửi dữ liệu tới tất cả frontend đang kết nối
      io.emit('mqtt-data', latestSensorData); // cript.js : phần 1
    } catch (err) {
      console.error('⚠️ Dữ liệu JSON không hợp lệ:', message.toString());
    }
  } 
});

// 5: Khi có client kết nối đến WebSocket
io.on("connection", (socket) => {
  console.log("🌐 Một client web đã kết nối");

  // 5.1: khi có kết nối client thì backend gửi dữ liệu về thời gian hiện tại cho hivemq

  // 5.1.1 lấy thời gian (year,month,day,hour,minute,second)
  const Timenow = new Date();
  const timeData = {
    year: Timenow.getFullYear(),
    month: Timenow.getMonth() + 1, // getMonth() trả về 0-11, nên +1
    day: Timenow.getDate(),
    hour: Timenow.getHours(),
    minute: Timenow.getMinutes(),
    second: Timenow.getSeconds()
  };

  // 5.1.2 gửi thời gian đó cho HiveMQ
  mqttClient.publish('set_time', JSON.stringify(timeData), // Chuyển thành chuỗi JSON, topic 7
    { qos: 1 }, 
    (err) => {
      if (err) {
        console.error('❌ Lỗi khi gửi thời gian tới HiveMQ:', err);
      } else {
        console.log('✅ Đã gửi thời gian tới HiveMQ:', timeData);
      }
    }
  );
  

  // 4.1: Gửi dữ liệu cảm biến mới nhất ngay khi client kết nối
  if (latestSensorData) {
    socket.emit('mqtt-data', latestSensorData);
  }

  // 4.2: Khi client gửi yêu cầu bật/tắt bơm
  socket.on('relay-control', (msg) => { // script.js : phần 2 
    if (msg === 'ON' || msg === 'OFF') {
      mqttClient.publish('ON/OFF_Relay', msg); // dữ liệu là String, topic 1
      console.log(`🚰 Đã gửi lệnh bơm: ${msg}`);
    } else {
      console.error('⚠️ Trạng thái relay không hợp lệ:', msg);
    }
  });

  
  // 4.3: Khi client nhập thời gian tưới cây
  socket.on("set_wateringtime", (cycleValue) => { // script.js : phần 4.1
    console.log("Received cycle value from frontend:", cycleValue);
    // Kiểm tra giá trị là số nguyên dương
    if (Number.isInteger(cycleValue) && cycleValue > 0) {
      // Gửi giá trị đến HiveMQ qua MQTT Topic 3
      mqttClient.publish("set_watering_time", cycleValue.toString(), (err) => {// gửi giá trị đó tới HiveMQ (dạng string)
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

  // 4.4: Khi client nhập chu kì khát 
  socket.on("set_water_limit", (value) => {
    if (Number.isInteger(value) && value >= 10) { // script.js 7.1
      mqttClient.publish("set_watering_point", value.toString());// topic 4, gửi dưới dạng string
      console.log(`💧 Đã gửi chu kì tưới: ${value}`);
    } else {
      socket.emit("water-limit-error", "⛔ chu kì tưới phải là số ≥ 10!");
    }
  });

  //4.5: khi client thêm lịch tưới cây
  socket.on("add_schedule", (data) => { // script.js 6.3.3
    const { weekday, hour, minute, second, order } = data;// gán dữ liệu lấy từ web

    // Lưu vào MySQL
    const query = 'INSERT INTO watering_schedule_mysql (weekday, hour, minute, second) VALUES (?, ?, ?, ?)';
    db.query(query, [weekday, hour, minute, second], (err, result) => {
      if (err) {
        console.error("❌ Lỗi khi lưu lịch vào MySQL:", err);
        socket.emit("schedule-error", "Lỗi khi lưu lịch!");
        return;
      }
      console.log("✅ Đã lưu lịch vào MySQL:", { weekday, hour, minute, second });

      // Gửi lịch đến HiveMQ
      const scheduleData = { weekday, hour, minute, second, order };
      mqttClient.publish('set_scheduleMQ',JSON.stringify(scheduleData),// topic 5
        { qos: 1 },
        (err) => {
          if (err) {
            console.error("❌ Lỗi khi gửi lịch tới HiveMQ:", err);
          } else {
            console.log("✅ Đã gửi lịch tới HiveMQ:", scheduleData);
          }
        }
      );
    });
  });

  // 4.6: khi client xóa lịch tưới cây
  socket.on("delete_schedule", (data) => { // script.js 6.7
    const { weekday, hour, minute, second, order } = data;

    // Xóa lịch trong MySQL
    const query = "DELETE FROM watering_schedule_mysql WHERE weekday = ? AND hour = ? AND minute = ? AND second = ?";
    db.query(query, [weekday, hour, minute, second], (err, result) => {
      if (err) {
        console.error("❌ Lỗi khi xóa lịch trong MySQL:", err);
        socket.emit("schedule-error", "Lỗi khi xóa lịch!");
        return;
      }
      if (result.affectedRows === 0) {
        console.warn("⚠️ Không tìm thấy lịch để xóa:", { weekday, hour, minute, second });
        socket.emit("schedule-error", "Không tìm thấy lịch để xóa!");
        return;
      }
      console.log("✅ Đã xóa lịch trong MySQL:", { weekday, hour, minute, second });

      // Gửi thông tin lịch bị xóa đến HiveMQ
      //const scheduleData = { weekday, hour, minute, second, order };
      mqttClient.publish("delete_scheduleMQ",order.toString(),{ qos: 1 },
        (err) => {
          if (err) {
            console.error("❌ Lỗi khi gửi thông tin xóa lịch tới HiveMQ:", err);
          } else {
            console.log("✅ Đã gửi thông tin xóa lịch tới HiveMQ:", order);
          }
        }
      );
    });
  });
  
  // 4.7: khi frontend yêu cầu dữ liệu lịch đã lưu trong database
  socket.on("request_schedule_upload", () => { // script.js 6.1
    const query = "SELECT weekday, hour, minute, second FROM watering_schedule_mysql";
    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Lỗi khi lấy danh sách lịch từ MySQL:", err);
        return;
      }
      // Gửi danh sách lịch về frontend
      const schedules = results.map((row, index) => ({
        weekday: row.weekday,
        hour: row.hour,
        minute: row.minute,
        second: row.second,
      }));
      console.log("✅ Gửi danh sách lịch tới frontend:", schedules);
      socket.emit("upload_schedule", schedules);// script.js 6.1.1
    });
  });


  // 4.8: Khi client ngắt kết nối
  socket.on('disconnect', () => {
    console.log('🔌 Một client đã ngắt kết nối');
  });


});

// 5: Khởi động server
app.use(express.json());        // Cho phép xử lý JSON body
//app.use("/api", apiRoutes);     // API cây, lịch tưới, điều khiển bơm
//app.use("/auth", authRoutes);   // Đăng ký, đăng nhập
server.listen(3323, () => {
  console.log("🚀 Backend server đang chạy tại http://localhost:3323");
});
