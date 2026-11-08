require('dotenv').config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedIfNeeded } = require('./seed');

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173"
].filter(Boolean);


const port = process.env.PORT || 5000;

async function start() {
  await connectDB();
  if (process.env.SEED_ON_START === 'true') {
    await seedIfNeeded();
  }
  app.listen(port, () => {
    console.log(`LearnHub API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
