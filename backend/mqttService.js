const mqtt = require('mqtt');
const db = require('./dbService');

const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('temperature_humidity');
});

client.on('message', async (topic, message) => {
  if (topic === 'temperature_humidity') {
    const [temp, humidity] = message.toString().split(',');
    await db.saveSensorData(temp, humidity);
  }
});

function publishRelay(status) {
  client.publish('ON/OFF_Relay', status);
}

module.exports = { publishRelay };
