require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'garage',
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 10,
  charset: 'utf8mb4_general_ci'
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersekret',
  resave: false,
  saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

function requireOwner(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'OWNER') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.get('/auth/me', async (req, res) => {
  if (!req.session.user) {
    return res.json(null);
  }
  res.json(req.session.user);
});

app.post('/auth/register', async (req, res) => {
  const { login, password, first_name, last_name, role } = req.body;
  if (!login || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const userRole = role === 'GUEST' ? 'GUEST' : 'OWNER';
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE login = ?', [login]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Login already exists' });
    }
    const [result] = await pool.query(
      'INSERT INTO users (login, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [login, password, first_name, last_name, userRole]
    );
    const user = { id: result.insertId, login, first_name, last_name, role: userRole };
    req.session.user = user;
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Missing login or password' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, login, password, first_name, last_name, role FROM users WHERE login = ?',
      [login]
    );
    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const u = rows[0];
    const user = { id: u.id, login: u.login, first_name: u.first_name, last_name: u.last_name, role: u.role };
    req.session.user = user;
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/cars', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM cars WHERE user_id = ? LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM cars WHERE user_id = ?',
      [userId]
    );
    res.json({ data: rows, total: countRows[0].total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/cars/:id', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM cars WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/cars', requireOwner, async (req, res) => {
  const userId = req.session.user.id;
  const { brand, model, year, power_hp, value, notes } = req.body;
  if (!brand || !model || !year) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO cars (user_id, brand, model, year, power_hp, value, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, brand, model, Number(year), power_hp || null, value || null, notes || null]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/cars/:id', requireOwner, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  const { brand, model, year, power_hp, value, notes } = req.body;
  if (!brand || !model || !year) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id FROM cars WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    await pool.query(
      'UPDATE cars SET brand = ?, model = ?, year = ?, power_hp = ?, value = ?, notes = ? WHERE id = ?',
      [brand, model, Number(year), power_hp || null, value || null, notes || null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/cars/:id', requireOwner, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  try {
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM cars WHERE user_id = ?',
      [userId]
    );
    if (countRows[0].total <= 1) {
      return res.status(400).json({ error: 'Musi zostać przynajmniej jedno auto (czymś trzeba jeździć po bułki)' });
    }
    const [rows] = await pool.query(
      'SELECT id FROM cars WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    await pool.query('DELETE FROM cars WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/cars/:carId/services', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const carId = req.params.carId;
  try {
    const [cars] = await pool.query(
      'SELECT id FROM cars WHERE id = ? AND user_id = ?',
      [carId, userId]
    );
    if (cars.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    const [rows] = await pool.query(
      "SELECT id, car_id, user_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, type, description, cost " +
      "FROM services WHERE car_id = ? AND user_id = ? ORDER BY date DESC",
      [carId, userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/services/:id', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  try {
    const [rows] = await pool.query(
      "SELECT id, car_id, user_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, type, description, cost " +
      "FROM services WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/cars/:carId/services', requireOwner, async (req, res) => {
  const userId = req.session.user.id;
  const carId = req.params.carId;
  const { date, type, description, cost } = req.body;
  if (!date || !type) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const [cars] = await pool.query(
      'SELECT id FROM cars WHERE id = ? AND user_id = ?',
      [carId, userId]
    );
    if (cars.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    const [result] = await pool.query(
      'INSERT INTO services (car_id, user_id, date, type, description, cost) VALUES (?, ?, ?, ?, ?, ?)',
      [carId, userId, date, type, description || null, cost || null]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/services/:id', requireOwner, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  const { date, type, description, cost } = req.body;
  if (!date || !type) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    await pool.query(
      'UPDATE services SET date = ?, type = ?, description = ?, cost = ? WHERE id = ?',
      [date, type, description || null, cost || null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/services/:id', requireOwner, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/public/cars', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.id, c.brand, c.model, c.year, u.login AS owner_login FROM cars c JOIN users u ON c.user_id = u.id LIMIT 20'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Garage backend listening on http://localhost:${port}`);
})