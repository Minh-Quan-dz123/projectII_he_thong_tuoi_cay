// authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const users = []; 

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Tài khoản đã tồn tại' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.json({ message: 'Đăng ký thành công' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
  res.json({ message: 'Đăng nhập thành công' });
});

module.exports = router;
