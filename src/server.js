import express from "express";
import { config } from "dotenv";
import { connectDB,disconnectDB } from "./config/db.js";

//Routes Import
import movieRoutes from "./routes/movieRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";

config();
connectDB();

const app = express();

//Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/movies",movieRoutes);
app.use("/auth",authRoutes);
app.use("/watchlist",watchlistRoutes);

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