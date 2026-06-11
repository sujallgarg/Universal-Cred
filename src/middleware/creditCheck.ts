import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis.js";
import { pool } from "../config/db.js";

// Express middleware to verify credit availability prior to downstream AI calls
export const creditCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userIdHeader = req.headers["x-user-id"];

  if (!userIdHeader) {
    res.status(400).json({ error: "Missing x-user-id header" });
    return;
  }

  const userId = Number(userIdHeader);
  if (isNaN(userId)) {
    res.status(400).json({ error: "x-user-id header must be a valid number" });
    return;
  }

  const balanceKey = `wallet:${userId}:balance`;
  const walletIdKey = `wallet:${userId}:id`;

  try {
    // 1. Fetch balance from Redis
    const cachedBalanceStr = await redisClient.get(balanceKey);

    let balance: bigint;
    let walletId: number;

    if (cachedBalanceStr !== null) {
      balance = BigInt(cachedBalanceStr);

      // Fetch cached wallet ID to avoid database hits
      const cachedWalletIdStr = await redisClient.get(walletIdKey);
      if (cachedWalletIdStr !== null) {
        walletId = Number(cachedWalletIdStr);
      } else {
        // Fallback lookup from database if only balance was cached
        const dbRes = await pool.query("SELECT id FROM wallets WHERE user_id = $1", [userId]);
        if (dbRes.rows.length > 0 && dbRes.rows[0]) {
          walletId = dbRes.rows[0].id;
          await redisClient.set(walletIdKey, String(walletId));
        } else {
          throw new Error("Wallet record missing in PostgreSQL database.");
        }
      }
    } else {
      // 2. Lazy loading: retrieve balance from PostgreSQL
      const dbRes = await pool.query(
        "SELECT w.id, w.balance FROM wallets w JOIN users u ON w.user_id = u.id WHERE u.id = $1",
        [userId]
      );

      if (dbRes.rows.length > 0 && dbRes.rows[0]) {
        walletId = dbRes.rows[0].id;
        balance = BigInt(dbRes.rows[0].balance);
      } else {
        // Auto-create user and wallet for seamless testing if they don't exist
        console.log(`[CreditCheck] User ${userId} not found. Provisioning default test wallet...`);
        const dbClient = await pool.connect();
        try {
          await dbClient.query("BEGIN");

          await dbClient.query(
            "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            [userId, `user_${userId}@example.com`, "bcrypt_hash"]
          );

          // Seed default balance of $500.00 = 500,000,000 micro-credits
          const defaultBalance = 500000000n;
          const insertRes = await dbClient.query(
            `INSERT INTO wallets (user_id, balance) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance 
             RETURNING id, balance`,
            [userId, defaultBalance]
          );

          await dbClient.query("COMMIT");

          const row = insertRes.rows[0];
          if (!row) throw new Error("Failed to retrieve wallet id after insert.");
          walletId = row.id;
          balance = BigInt(row.balance);
        } catch (txError) {
          await dbClient.query("ROLLBACK");
          throw txError;
        } finally {
          dbClient.release();
        }
      }

      // Sync loaded values to Redis
      await redisClient.set(balanceKey, String(balance));
      await redisClient.set(walletIdKey, String(walletId));
    }

    // Attach details to the request object for controllers downstream
    (req as any).userId = userId;
    (req as any).walletId = walletId;
    (req as any).balance = balance;

    // 3. Evaluate balance limits
    if (balance <= 0n) {
      res.status(402).json({
        error: "Insufficient AI Credits",
        message: "Your credit balance is depleted (0 or negative). Please top up.",
        balance: Number(balance),
      });
      return;
    }

    next();
  } catch (error) {
    console.error("[CreditCheck] Middleware execution failure:", error);
    res.status(500).json({ error: "Credit verification system error." });
  }
};

export default creditCheck;
