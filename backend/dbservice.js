const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'your_database'
});

async function saveSensorData(temp, humidity) {
  await pool.query('INSERT INTO sensors (temp, humidity) VALUES (?, ?)', [temp, humidity]);
}

async function getSensorData() {
  const [[row]] = await pool.query('SELECT * FROM sensors ORDER BY id DESC LIMIT 1');
  const [[limitRow]] = await pool.query('SELECT limit_value FROM settings LIMIT 1');
  return [row.temp, row.humidity, limitRow.limit_value];
}

async function setWaterLimit(limit) {
  await pool.query('UPDATE settings SET limit_value = ? WHERE id = 1', [limit]);
}

module.exports = { saveSensorData, getSensorData, setWaterLimit };
