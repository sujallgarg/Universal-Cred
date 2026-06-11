import axios from "axios";

const API_BASE = "http://localhost:5001";
const TEST_USER = "98765";

async function runTests() {
  console.log("=== Liquid Credits Backend Integration Test ===");

  try {
    // 1. Health Endpoint Validation
    console.log("\n[Test 1] Checking backend health check...");
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log("✔ Health Status:", healthRes.data);

    // 2. Retrieve Initial Balance (seeded default $500.00 USD)
    console.log("\n[Test 2] Querying wallet balance for user 98765...");
    const balRes = await axios.get(`${API_BASE}/v1/wallet/balance`, {
      headers: { "x-user-id": TEST_USER }
    });
    console.log("✔ Wallet Balance Details:", balRes.data);
    const initialBalance = balRes.data.balance;

    // 3. Perform Top-Up API Call (Adding $100.00 USD = 100,000,000 credits)
    console.log("\n[Test 3] Execution: Top Up wallet with $100.00 USD (100M credits)...");
    const topupRes = await axios.post(`${API_BASE}/v1/wallet/topup`, 
      { amount: 100000000 },
      { headers: { "x-user-id": TEST_USER } }
    );
    console.log("✔ Top Up Response:", topupRes.data);
    const postTopupBalance = topupRes.data.newBalance;

    if (postTopupBalance !== initialBalance + 100000000) {
      throw new Error(`Balance calculation mismatch! Expected ${initialBalance + 100000000}, got ${postTopupBalance}`);
    }
    console.log("✔ Balance updated successfully!");

    // 4. SSE chat completion stream
    console.log("\n[Test 4] Querying chat completions SSE stream...");
    const streamRes = await axios.post(`${API_BASE}/v1/chat/completions`,
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Explain multi-agent compute scaling in one simple sentence." }],
        stream: true
      },
      {
        headers: { "x-user-id": TEST_USER },
        responseType: "stream"
      }
    );

    console.log("Reading SSE stream chunks:");
    let textReceived = "";
    
    await new Promise<void>((resolve, reject) => {
      streamRes.data.on("data", (chunk: Buffer) => {
        const lines = chunk.toString("utf8").split("\n");
        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data:")) {
            const dataVal = cleanLine.slice(5).trim();
            if (dataVal === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataVal);
              if (parsed.choices?.[0]?.delta?.content) {
                process.stdout.write(parsed.choices[0].delta.content);
                textReceived += parsed.choices[0].delta.content;
              }
            } catch {}
          }
        }
      });

      streamRes.data.on("end", () => {
        console.log("\n✔ Stream connection closed successfully.");
        resolve();
      });

      streamRes.data.on("error", (err: any) => {
        reject(err);
      });
    });

    // Wait 1.5 seconds for the background worker to pop and flush to PostgreSQL
    console.log("\nWaiting for async sync worker to commit ledger transaction...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 5. Query un-alterable persistent ledger logs
    console.log("\n[Test 5] Fetching un-alterable persistent audit ledger logs...");
    const ledgerRes = await axios.get(`${API_BASE}/v1/wallet/ledger`, {
      headers: { "x-user-id": TEST_USER }
    });
    console.log(`✔ Retrieved ${ledgerRes.data.ledger.length} ledger entries:`);
    for (const log of ledgerRes.data.ledger.slice(0, 5)) {
      console.log(`  - [${log.createdAt}] [${log.type}] ${log.description}: Amount: ${log.amount / 1000000} USD`);
    }

    console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===");

  } catch (error: any) {
    console.error("\n❌ Integration Test Failed:", error.message || error);
    if (error.response) {
      console.error("Response Details:", error.response.status, error.response.data);
    }
  }
}

runTests();
