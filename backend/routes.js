// routes.js
const express = require('express');
const router = express.Router();
const mqttClient = require('./mqttService');
const db = require('./dbservice');

// Dữ liệu giả để test nếu chưa có cơ sở dữ liệu
let plants = [];
let cycles = [];
let schedules = [];

router.get('/plants', (req, res) => res.json(plants));
router.post('/plants', (req, res) => {
  plants.push(req.body);
  res.json({ message: 'Đã thêm cây' });
});

router.get('/cycles', (req, res) => res.json(cycles));
router.post('/cycles', (req, res) => {
  cycles.push(req.body);
  res.json({ message: 'Đã thêm chu kỳ' });
});

router.get('/schedules', (req, res) => res.json(schedules));
router.post('/schedules', (req, res) => {
  schedules.push(req.body);
  res.json({ message: 'Đã thêm lịch tưới' });
});

router.get('/sensor', async (req, res) => {
  const [temp, humidity, limit] = await db.getSensorData();
  res.json({ temp, humidity, waterLimit: limit });
});

router.post('/relay', (req, res) => {
  const { status } = req.body;
  mqttClient.publish('ON/OFF_Relay', status);
  res.json({ success: true });
});

router.post('/water-limit', async (req, res) => {
  await db.setWaterLimit(req.body.limit);
  res.json({ success: true });
});

module.exports = router;
