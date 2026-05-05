const mongoose = require("mongoose");

async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Add it to your environment.");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");
}

module.exports = { connectMongo };
