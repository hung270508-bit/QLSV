require('dotenv').config({ path: '.env' });
const mysql = require('mysql2');

console.log("Connecting to Cloud DB:", process.env.DB_HOST);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.query('ALTER TABLE users ADD COLUMN Avatar LONGTEXT NULL;', (err, res) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') {
    console.error('Error adding Avatar column to cloud DB:', err);
  } else {
    console.log('Successfully added Avatar column to cloud DB users table (or it already exists).');
  }
  db.end();
});
