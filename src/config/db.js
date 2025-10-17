const mongoose = require('mongoose');

async function connectDB(uri, dbName) {
  console.log("🧠 connectDB() called");
  console.log("URI:", uri);
  console.log("DB Name:", dbName);
  try {
    await mongoose.connect(uri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 10000
    });
    console.log(`✅ [MongoDB] connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ [MongoDB] connection failed:", err.message);
    throw err;
  }
}

async function closeDB() {
  try {
    await mongoose.connection.close(false);
    console.log("[MongoDB] connection closed");
  } catch (err) {
    console.error("[MongoDB] error on close:", err);
  }
}

module.exports = { connectDB, closeDB };
