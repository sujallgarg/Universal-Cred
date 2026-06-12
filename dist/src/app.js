import express from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import { redisClient } from "./config/redis.js";
import chatRouter from "./routes/v1/chat.routes.js";
import walletRouter from "./routes/v1/wallet.routes.js";
const app = express();
// Enable CORS
app.use(cors());
// Accept JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Health check endpoint checking Postgres and Redis integrity
app.get("/health", async (_req, res) => {
    let isDbConnected = false;
    let isRedisConnected = false;
    try {
        const dbRes = await pool.query("SELECT 1");
        isDbConnected = dbRes.rowCount !== null;
    }
    catch (error) {
        console.error("Healthcheck: PostgreSQL check failed:", error);
    }
    try {
        if (redisClient.isOpen) {
            await redisClient.ping();
            isRedisConnected = true;
        }
    }
    catch (error) {
        console.error("Healthcheck: Redis check failed:", error);
    }
    const statusCode = isDbConnected && isRedisConnected ? 200 : 500;
    res.status(statusCode).json({
        status: isDbConnected && isRedisConnected ? "UP" : "DEGRADED",
        database: isDbConnected ? "CONNECTED" : "DISCONNECTED",
        redis: isRedisConnected ? "CONNECTED" : "DISCONNECTED",
        timestamp: new Date().toISOString(),
    });
});
// Mount Chat Route
app.use("/v1/chat", chatRouter);
// Mount Wallet Route
app.use("/v1/wallet", walletRouter);
// Default 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error("Global Error Handler caught error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "An unexpected error occurred",
    });
});
export default app;
//# sourceMappingURL=app.js.map