require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Koneksi berhasil!');
    client.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
  