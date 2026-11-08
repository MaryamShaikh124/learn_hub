require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');

async function seedIfNeeded() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before creating the administrator.');
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error(`The account ${email} already exists and is not an administrator.`);
    }
    console.log(`Administrator ${email} already exists; no account changes were made.`);
    return existing;
  }

  const admin = await User.create({
    name: ADMIN_NAME,
    email,
    password: ADMIN_PASSWORD,
    role: 'admin',
  });
  console.log(`Administrator ${email} created.`);
  return admin;
}

if (require.main === module) {
  connectDB()
    .then(seedIfNeeded)
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
      console.error(error);
      await mongoose.disconnect();
      process.exitCode = 1;
    });
}

module.exports = { seedIfNeeded };
