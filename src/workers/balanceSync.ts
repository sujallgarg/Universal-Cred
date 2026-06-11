import { redisClient } from "../config/redis.js";
import { pool } from "../config/db.js";

let running = false;

/**
 * Initializes and starts the background ledger synchronization worker loop.
 */
export const startBalanceSyncWorker = (): void => {
  if (running) {
    console.log("[BalanceSyncWorker] Sync loop already active.");
    return;
  }
  
  running = true;
  console.log("[BalanceSyncWorker] Queue polling thread initialized.");

  // Trigger the processing loop asynchronously
  processQueue().catch((err) => {
    console.error("[BalanceSyncWorker] Fatal crash in queue polling loop:", err);
    running = false;
  });
};

/**
 * Halts the background worker processing loop.
 */
export const stopBalanceSyncWorker = (): void => {
  running = false;
  console.log("[BalanceSyncWorker] Halting queue polling thread.");
};

/**
 * Main queue processing loop.
 */
const processQueue = async (): Promise<void> => {
  while (running) {
    try {
      // 1. Keep thread idle if Redis client is currently disconnected
      if (!redisClient.isOpen) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // 2. Perform blocking pop from balance sync queue (timeout 0 = block indefinitely)
      const job = await redisClient.blPop("balance_sync_queue", 0);
      
      if (!job || !job.element) {
        continue;
      }

      const rawPayload = job.element;
      console.log(`[BalanceSyncWorker] Dequeued sync job: ${rawPayload}`);

      let syncJob;
      try {
        syncJob = JSON.parse(rawPayload);
      } catch (parseError) {
        console.error("[BalanceSyncWorker] Failed to parse JSON payload. Discarding invalid task.", rawPayload, parseError);
        continue;
      }

      let success = false;
      let dbClient;

      try {
        dbClient = await pool.connect();
        
        // 3. Begin PostgreSQL transaction for atomicity
        await dbClient.query("BEGIN");

        const costVal = BigInt(syncJob.cost);
        const walletId = Number(syncJob.walletId);

        // Deduct balance from persistence layer
        const updateWalletQuery = `
          UPDATE wallets 
          SET balance = balance - $1, updated_at = NOW() 
          WHERE id = $2 
          RETURNING balance
        `;
        const walletRes = await dbClient.query(updateWalletQuery, [costVal, walletId]);
        
        if (walletRes.rowCount === 0) {
          throw new Error(`Wallet ID ${walletId} does not exist in PostgreSQL schema.`);
        }

        const newBalance = walletRes.rows[0]?.balance;

        // Append to the unalterable audit ledger
        const insertLedgerQuery = `
          INSERT INTO ledger_entries (
            wallet_id, amount, type, provider, model, input_tokens, output_tokens, credits_charged, description
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
        `;
        const ledgerValues = [
          walletId,
          -costVal, // Debited balance represented as negative ledger amount
          "charge",
          syncJob.provider,
          syncJob.model,
          syncJob.inputTokens,
          syncJob.outputTokens,
          costVal,
          `AI completions: ${syncJob.provider}/${syncJob.model}`,
        ];

        await dbClient.query(insertLedgerQuery, ledgerValues);

        // Commit transaction
        await dbClient.query("COMMIT");
        success = true;
        
        console.log(`[BalanceSyncWorker] Synced user ${syncJob.userId} balance. Persistent DB Balance: ${newBalance}`);
      } catch (dbError) {
        // Rollback transaction on failure
        if (dbClient) {
          await dbClient.query("ROLLBACK");
        }
        
        console.error(`[BalanceSyncWorker] Persistent DB sync failure for user ${syncJob.userId}. Re-enqueueing...`, dbError);
        
        // Re-enqueue job back to the HEAD of the Redis list so it is retried next
        try {
          await redisClient.lPush("balance_sync_queue", rawPayload);
          console.log("[BalanceSyncWorker] Job re-enqueued to balance_sync_queue.");
        } catch (redisErr) {
          console.error("[BalanceSyncWorker] Critical failure: Could not re-enqueue job in Redis!", redisErr);
        }

        // Apply a backoff delay to prevent hitting database hard if offline
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } finally {
        if (dbClient) {
          dbClient.release();
        }
      }
    } catch (loopError) {
      console.error("[BalanceSyncWorker] Queue polling iteration error:", loopError);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};
export default startBalanceSyncWorker;
