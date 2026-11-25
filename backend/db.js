import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Leave empty for default XAMPP MySQL setup
  database: 'rtu_campus_appointmentsystem',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0

});

export default pool;