// require('dotenv').config();
// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'platform_kopi',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// pool.getConnection()
//   .then((connection) => {
//     console.log('✓ Database connected successfully');
//     connection.release();
//   })
//   .catch((error) => {
//     console.error('✗ Database connection failed:', error.message);
//   });

// module.exports = pool;

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test koneksi saat server pertama kali dinyalakan
pool.getConnection()
    .then(connection => {
        console.log('Database terhubung dengan sukses ke aaPanel MySQL!');
        connection.release();
    })
    .catch(err => {
        console.error('Gagal terhubung ke database:', err.message);
    });

module.exports = pool;