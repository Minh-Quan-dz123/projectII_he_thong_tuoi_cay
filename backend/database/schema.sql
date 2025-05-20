// ==== /backend/database/schema.sql ====
-- Tạo CSDL nếu chưa có
CREATE DATABASE IF NOT EXISTS iot_plant;
USE iot_plant;

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL
);

-- Bảng dữ liệu cảm biến
CREATE TABLE IF NOT EXISTS sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature FLOAT NOT NULL,
  humidity FLOAT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lịch tưới cây
CREATE TABLE IF NOT EXISTS watering_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hour INT NOT NULL,
  minute INT NOT NULL,
  repeat_days VARCHAR(50),
  active BOOLEAN DEFAULT TRUE
);
