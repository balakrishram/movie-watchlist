import express from "express";
import { config } from "dotenv";
import { connectDB,disconnectDB } from "./Config/db.js";

//Routes Import
import movieRoutes from "./Routes/movieRoutes.js";

config();
connectDB();

const app = express();

// API Routes
app.use("/movies",movieRoutes);


const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//Handle unhandled promise rejections e.g. database connection errors
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  })}
);

//Handle uncaught exceptions e.g. programming errors
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  })}
);

//Graceful shutdown on SIGTERM signal
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Closing server...");
  await disconnectDB();
  process.exit(0);
});