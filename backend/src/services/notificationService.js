const { pool } = require('../config/database');

let io = null;

function setSocketIO(socketIO) {
  io = socketIO;
}

async function createNotification(userId, type, title, data = {}) {
  const message = data.message || null;
  await pool.execute(
    'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?,?,?,?,?)',
    [userId, type, title, message, JSON.stringify(data)]
  );

  if (io) {
    io.to(`user:${userId}`).emit('notification', { type, title, data });
  }
}

module.exports = { createNotification, setSocketIO };
