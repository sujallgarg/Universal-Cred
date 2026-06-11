import { Router } from "express";
import { pool } from "../../config/db.js";
import { redisClient } from "../../config/redis.js";

const router = Router();

// GET /v1/wallet/balance - Fetch active balance for the given user header (cached in Redis, lazy loaded from PG)
router.get("/balance", async (req, res) => {
  const userIdHeader = req.headers["x-user-id"];
  if (!userIdHeader) {
    res.status(400).json({ error: "Missing x-user-id header" });
    return;
  }
  const userId = Number(userIdHeader);
  if (isNaN(userId)) {
    res.status(400).json({ error: "x-user-id must be a valid number" });
    return;
  }

  const balanceKey = `wallet:${userId}:balance`;
  const walletIdKey = `wallet:${userId}:id`;

  try {
    let balanceStr = await redisClient.get(balanceKey);
    let walletIdStr = await redisClient.get(walletIdKey);

    if (balanceStr === null || walletIdStr === null) {
      // Lazy load from DB
      const dbRes = await pool.query(
        "SELECT w.id, w.balance FROM wallets w JOIN users u ON w.user_id = u.id WHERE u.id = $1",
        [userId]
      );

      if (dbRes.rows.length > 0 && dbRes.rows[0]) {
        const wallet = dbRes.rows[0];
        balanceStr = String(wallet.balance);
        walletIdStr = String(wallet.id);

        await redisClient.set(balanceKey, balanceStr);
        await redisClient.set(walletIdKey, walletIdStr);
      } else {
        // Auto-provision test wallet for the new developer session
        console.log(`[WalletAPI] Provisioning default test wallet for user ${userId}...`);
        const dbClient = await pool.connect();
        try {
          await dbClient.query("BEGIN");
          await dbClient.query(
            "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            [userId, `user_${userId}@example.com`, "bcrypt_hash"]
          );
          const defaultBalance = 500000000n; // $500.00 USD
          const insertRes = await dbClient.query(
            "INSERT INTO wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance RETURNING id, balance",
            [userId, defaultBalance]
          );
          await dbClient.query("COMMIT");

          const row = insertRes.rows[0];
          if (!row) throw new Error("Database wallet insertion failed.");
          balanceStr = String(row.balance);
          walletIdStr = String(row.id);

          await redisClient.set(balanceKey, balanceStr);
          await redisClient.set(walletIdKey, walletIdStr);
        } catch (txErr) {
          await dbClient.query("ROLLBACK");
          throw txErr;
        } finally {
          dbClient.release();
        }
      }
    }

    res.json({
      userId,
      walletId: Number(walletIdStr),
      balance: Number(balanceStr),
    });
  } catch (error: any) {
    console.error("[WalletAPI] Failed to retrieve balance:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

// POST /v1/wallet/topup - Grant credits to the user wallet and sync both cache and unalterable ledger
router.post("/topup", async (req, res) => {
  const userIdHeader = req.headers["x-user-id"];
  if (!userIdHeader) {
    res.status(400).json({ error: "Missing x-user-id header" });
    return;
  }
  const userId = Number(userIdHeader);
  if (isNaN(userId)) {
    res.status(400).json({ error: "x-user-id must be a valid number" });
    return;
  }

  const { amount } = req.body; // In micro-credits (1 USD = 1,000,000 credits)
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: "Invalid amount parameter. Must be greater than 0." });
    return;
  }

  const topupAmount = BigInt(amount);
  const balanceKey = `wallet:${userId}:balance`;
  const walletIdKey = `wallet:${userId}:id`;

  try {
    const dbClient = await pool.connect();
    try {
      await dbClient.query("BEGIN");

      // Verify wallet or establish if missing
      const dbRes = await dbClient.query("SELECT id, balance FROM wallets WHERE user_id = $1", [userId]);
      let walletId: number;
      let oldBalance = 0n;

      if (dbRes.rows.length === 0) {
        await dbClient.query(
          "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
          [userId, `user_${userId}@example.com`, "bcrypt_hash"]
        );
        const insertRes = await dbClient.query(
          "INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id, balance",
          [userId, topupAmount]
        );
        const row = insertRes.rows[0];
        if (!row) throw new Error("Wallet creation failure.");
        walletId = row.id;
      } else {
        const wallet = dbRes.rows[0];
        if (!wallet) throw new Error("Wallet row empty.");
        walletId = wallet.id;
        oldBalance = BigInt(wallet.balance);
        await dbClient.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2",
          [topupAmount, walletId]
        );
      }

      // Record deposit to unalterable ledger logs
      const insertLedgerQuery = `
        INSERT INTO ledger_entries (
          wallet_id, amount, type, description, credits_charged
        ) VALUES (
          $1, $2, $3, $4, $5
        )
      `;
      await dbClient.query(insertLedgerQuery, [
        walletId,
        topupAmount,
        "grant",
        `Deposit Credit Top-Up`,
        0n, // 0 credits charged
      ]);

      await dbClient.query("COMMIT");

      // Set new values in Redis cache
      const newBalance = oldBalance + topupAmount;
      await redisClient.set(balanceKey, String(newBalance));
      await redisClient.set(walletIdKey, String(walletId));

      console.log(`[WalletAPI] User ${userId} topped up by ${topupAmount}. New balance: ${newBalance}`);

      res.json({
        success: true,
        userId,
        walletId,
        newBalance: Number(newBalance),
      });
    } catch (txErr) {
      await dbClient.query("ROLLBACK");
      throw txErr;
    } finally {
      dbClient.release();
    }
  } catch (error: any) {
    console.error("[WalletAPI] Top up processing error:", error);
    res.status(500).json({ error: "Failed to process wallet top-up" });
  }
});

// GET /v1/wallet/ledger - Fetch recent persistent ledger records for security logs
router.get("/ledger", async (req, res) => {
  const userIdHeader = req.headers["x-user-id"];
  if (!userIdHeader) {
    res.status(400).json({ error: "Missing x-user-id header" });
    return;
  }
  const userId = Number(userIdHeader);
  if (isNaN(userId)) {
    res.status(400).json({ error: "x-user-id must be a number" });
    return;
  }

  try {
    const ledgerRes = await pool.query(
      `SELECT le.* 
       FROM ledger_entries le
       JOIN wallets w ON le.wallet_id = w.id
       WHERE w.user_id = $1
       ORDER BY le.created_at DESC
       LIMIT 30`,
      [userId]
    );

    res.json({
      userId,
      ledger: ledgerRes.rows.map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        type: row.type,
        provider: row.provider,
        model: row.model,
        inputTokens: row.input_tokens,
        outputTokens: row.output_tokens,
        creditsCharged: Number(row.credits_charged),
        description: row.description,
        createdAt: row.created_at,
      })),
    });
  } catch (error: any) {
    console.error("[WalletAPI] Failed to fetch ledger logs:", error);
    res.status(500).json({ error: "Failed to retrieve ledger logs" });
  }
});

export default router;
