require('dotenv').config();
const { connectDB, closeDB } = require('./src/config/db');
const createApp = require('./src/app');
const { ensureSeededOnce } = require('./src/services/restaurants.service');

const PORT = process.env.PORT || 5050;

const app = createApp();

async function start() {
  try {
    console.log("🧩 STEP 1: start() called");
    console.log("🔗 MONGODB_URI:", process.env.MONGODB_URI);
    console.log("📂 DB_NAME:", process.env.DB_NAME);

    await connectDB(process.env.MONGODB_URI, process.env.DB_NAME);
    console.log("✅ STEP 2: connectDB() completed");

    await ensureSeededOnce();
    console.log("✅ STEP 3: ensureSeededOnce() completed");

    if (require.main === module) {
      app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

start();
