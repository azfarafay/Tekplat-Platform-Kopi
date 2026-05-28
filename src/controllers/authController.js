const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Register - Membuat akun pengguna baru
 * POST /api/auth/register
 * Body: { name, email, password, role, nib_number }
 */
const register = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { name, email, password, role, nib_number } = req.body;

    // Validasi input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password, and role are required',
      });
    }

    // Validasi role
    if (!['roastery', 'coffee_shop', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be one of: roastery, coffee_shop, admin',
      });
    }

    // Check if email already exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user ke database
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, role, nib_number) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, nib_number || null]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: result.insertId,
        name,
        email,
        role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Login - Autentikasi pengguna
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    // Cari user by email
    const [users] = await connection.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  register,
  login,
};
