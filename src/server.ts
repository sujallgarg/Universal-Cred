import app from "./app.js";
import { ConnectDB, initializeDatabase } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { startBalanceSyncWorker } from "./workers/balanceSync.js";

const PORT = Number(process.env.PORT || 5000);
const HOST = "0.0.0.0";

const startServer = async () => {
  try {
    console.log("Starting Liquid Credits server backbone...");

    // 1. Establish PostgreSQL connection pool integrity
    await ConnectDB();

    // 2. Initialize tables (users, wallets, ledger)
    await initializeDatabase();

    // 3. Connect to Redis instance
    await connectRedis();

    // 4. Spin up the background balance sync worker
    startBalanceSyncWorker();

    // 5. Listen securely on host 0.0.0.0
    app.listen(PORT, HOST, () => {
      console.log(`[Server] Running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Critical startup failure:", error);
    process.exit(1);
  }
};

startServer();
