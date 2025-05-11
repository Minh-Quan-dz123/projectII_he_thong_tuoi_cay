const express = require('express');
const router = express.Router();
const db = require('../dbService');
const mqtt = require('../mqttService');

// Lấy dữ liệu cảm biến
router.get('/sensor', async (req, res) => {
  const [temp, humidity, limit] = await db.getSensorData();
  res.json({ temp, humidity, waterLimit: limit });
});

// Điều khiển bơm
router.post('/relay', (req, res) => {
  const { status } = req.body;
  mqtt.publishRelay(status);
  res.json({ success: true });
});

// Lưu điểm tưới hạn
router.post('/water-limit', async (req, res) => {
  await db.setWaterLimit(req.body.limit);
  res.json({ success: true });
});

module.exports = router;
