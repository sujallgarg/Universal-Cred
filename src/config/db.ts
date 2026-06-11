import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const isLocalhost = process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1");

// PostgreSQL Connection Pool Setup
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

// Fallback in-memory database mock state
let useDbMemoryFallback = false;
const mockWallets = new Map<number, { id: number; user_id: number; balance: bigint; created_at: Date; updated_at: Date }>();
const mockLedgerEntries: any[] = [];

// Pre-seed test user 98765 with a fake balance of $500.00 USD (500,000,000 micro-credits)
mockWallets.set(98765, {
  id: 999,
  user_id: 98765,
  balance: 500000000n,
  created_at: new Date(),
  updated_at: new Date(),
});

// Intercept pool queries to inject mock database logic when persistent PG is offline
const originalQuery = pool.query.bind(pool);
pool.query = (async (text: any, params?: any[]): Promise<any> => {
  if (useDbMemoryFallback) {
    const sql = typeof text === "string" ? text.toLowerCase() : "";
    console.log(`[DB Fallback] Executing mock query: ${sql.trim().replace(/\s+/g, " ").slice(0, 80)}...`);

    if (sql.includes("select 1")) {
      return { rowCount: 1, rows: [{ "1": 1 }] };
    }

    if (sql.includes("select w.id, w.balance") || sql.includes("select id, balance from wallets where user_id =")) {
      const userId = Number(params?.[0] || 98765);
      let wallet = mockWallets.get(userId);
      if (!wallet) {
        wallet = {
          id: 999,
          user_id: userId,
          balance: 500000000n, // Default seeded balance: $500.00
          created_at: new Date(),
          updated_at: new Date(),
        };
        mockWallets.set(userId, wallet);
      }
      return {
        rowCount: 1,
        rows: [{ id: wallet.id, balance: wallet.balance.toString() }],
      };
    }

    if (sql.includes("insert into users")) {
      return { rowCount: 1, rows: [{ id: params?.[0] }] };
    }

    if (sql.includes("insert into wallets")) {
      const userId = Number(params?.[0] || 98765);
      const initBal = params?.[1] ? BigInt(params[1]) : 500000000n;
      let wallet = mockWallets.get(userId);
      if (!wallet) {
        wallet = {
          id: 999,
          user_id: userId,
          balance: initBal,
          created_at: new Date(),
          updated_at: new Date(),
        };
        mockWallets.set(userId, wallet);
      } else {
        wallet.balance = initBal;
      }
      return {
        rowCount: 1,
        rows: [{ id: wallet.id, balance: wallet.balance.toString() }],
      };
    }

    if (sql.includes("update wallets set balance = balance -")) {
      const debit = BigInt(params?.[0] || 0);
      const walletId = Number(params?.[1] || 999);
      
      let targetWallet: any = null;
      for (const w of mockWallets.values()) {
        if (w.id === walletId) {
          targetWallet = w;
          break;
        }
      }

      if (targetWallet) {
        targetWallet.balance -= debit;
        targetWallet.updated_at = new Date();
        return {
          rowCount: 1,
          rows: [{ balance: targetWallet.balance.toString() }],
        };
      }
      return { rowCount: 0, rows: [] };
    }

    if (sql.includes("update wallets set balance = balance +")) {
      const credit = BigInt(params?.[0] || 0);
      const walletId = Number(params?.[1] || 999);

      let targetWallet: any = null;
      for (const w of mockWallets.values()) {
        if (w.id === walletId) {
          targetWallet = w;
          break;
        }
      }

      if (targetWallet) {
        targetWallet.balance += credit;
        targetWallet.updated_at = new Date();
        return {
          rowCount: 1,
          rows: [{ balance: targetWallet.balance.toString() }],
        };
      }
      return { rowCount: 0, rows: [] };
    }

    if (sql.includes("insert into ledger_entries")) {
      const newEntry = {
        id: mockLedgerEntries.length + 1,
        wallet_id: params?.[0],
        amount: params?.[1] ? BigInt(params[1]) : 0n,
        type: params?.[2] || "charge",
        provider: params?.[3] || null,
        model: params?.[4] || null,
        input_tokens: params?.[5] || 0,
        output_tokens: params?.[6] || 0,
        credits_charged: params?.[7] ? BigInt(params[7]) : 0n,
        description: params?.[8] || "Deposit Top-Up",
        created_at: new Date(),
      };
      mockLedgerEntries.unshift(newEntry); // Prepend to show latest first
      return { rowCount: 1, rows: [newEntry] };
    }

    if (sql.includes("select le.* from ledger_entries")) {
      const userId = Number(params?.[0] || 98765);
      const wallet = mockWallets.get(userId);
      const walletId = wallet ? wallet.id : 999;
      
      const filtered = mockLedgerEntries.filter((le) => le.wallet_id === walletId);
      return {
        rowCount: filtered.length,
        rows: filtered.map((le) => ({
          ...le,
          id: le.id,
          amount: le.amount.toString(),
          type: le.type,
          provider: le.provider,
          model: le.model,
          input_tokens: le.input_tokens,
          output_tokens: le.output_tokens,
          credits_charged: le.credits_charged.toString(),
          description: le.description,
          created_at: le.created_at,
        })),
      };
    }

    return { rowCount: 0, rows: [] };
  }

  return originalQuery(text, params);
}) as any;

// Establish pool connection handshake
export const ConnectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log("Database connection pool established successfully");
    client.release();
    useDbMemoryFallback = false;
  } catch (error) {
    console.warn("[PostgreSQL] Connection failed. Fallback to in-memory DB mocks active.");
    useDbMemoryFallback = true;
  }
};

// Initialize schema fallback if run directly
export const initializeDatabase = async (): Promise<void> => {
  if (useDbMemoryFallback) {
    console.log("[DB Fallback] Schema verification bypassed (running in-memory mocks).");
    return;
  }

  const schemaDDL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      balance BIGINT NOT NULL DEFAULT 500000000,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id SERIAL PRIMARY KEY,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      amount BIGINT NOT NULL,
      type VARCHAR(50) NOT NULL,
      provider VARCHAR(50),
      model VARCHAR(50),
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      credits_charged BIGINT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await ConnectDB();
    if (!useDbMemoryFallback) {
      await pool.query(schemaDDL);
      console.log("Database tables initialized successfully via Pool");

      // Seed/Ensure test user 98765 has at least $500.00 USD free credits in Postgres
      await pool.query(
        "INSERT INTO users (id, email, password_hash) VALUES (98765, 'developer@example.com', 'dev_hash') ON CONFLICT (id) DO NOTHING"
      );
      await pool.query(
        "INSERT INTO wallets (user_id, balance) VALUES (98765, 500000000) ON CONFLICT (user_id) DO UPDATE SET balance = CASE WHEN wallets.balance < 500000000 THEN 500000000 ELSE wallets.balance END"
      );
      console.log("Test developer wallet balance verified/seeded in PostgreSQL");
    }
  } catch (error) {
    console.error("Error during database table initialization:", error);
  }
};

export default ConnectDB;
