
require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = require('../app');
const { connectDB } = require('../config/db');

let dbPromise;

module.exports = async (req, res) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB().catch((error) => {
        dbPromise = null;
        throw error;
      });
    }

    await dbPromise;
    return app(req, res);
  } catch (error) {
    console.error('Vercel backend error:', error);
    return res.status(500).json({
      success: false,
      message: 'Backend server error'
    });
  }
};
