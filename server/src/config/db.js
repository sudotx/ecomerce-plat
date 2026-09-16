import mongoose from "mongoose";

/**
 * Connect to MongoDB using MONGODB_URI from the environment.
 * Exits the process with an error if the connection fails so that
 * the server never starts in a broken state.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Create server/.env from server/.env.example."
    );
  }

  await mongoose.connect(uri);
  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
  );
}