import axios from "axios";

const API_BASE = "http://localhost:5001";
const TEST_USER = "98765";

async function main() {
  console.log("=== Liquid Credits Terminal Client Demo ===");
  console.log("This script simulates an external application calling your backend directly.");

  try {
    // 1. Check starting balance
    const startRes = await axios.get(`${API_BASE}/v1/wallet/balance`, {
      headers: { "x-user-id": TEST_USER }
    });
    const startUSD = (startRes.data.balance / 1000000).toFixed(4);
    console.log(`\n[Start] Wallet Balance for user ${TEST_USER}: $${startUSD} USD`);

    // 2. Perform streaming completions proxy request (Auto-deducts balance)
    console.log("\n[Execute] Streaming completion from gateway...");
    const response = await axios.post(`${API_BASE}/v1/chat/completions`,
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Explain compute routing in one sentence." }],
        stream: true
      },
      {
        headers: { "x-user-id": TEST_USER },
        responseType: "stream"
      }
    );

    await new Promise<void>((resolve, reject) => {
      response.data.on("data", (chunk: Buffer) => {
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
              }
            } catch {}
          }
        }
      });

      response.data.on("end", resolve);
      response.data.on("error", reject);
    });

    console.log("\n\n✔ Streaming completion finished successfully.");

    // Wait 1.5 seconds for the background worker to flush the ledger to PostgreSQL
    console.log("\nWaiting for async sync worker to flush ledger...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Check final balance
    const endRes = await axios.get(`${API_BASE}/v1/wallet/balance`, {
      headers: { "x-user-id": TEST_USER }
    });
    const endUSD = (endRes.data.balance / 1000000).toFixed(4);
    const difference = ((startRes.data.balance - endRes.data.balance) / 1000000).toFixed(4);

    console.log(`[End] Wallet Balance for user ${TEST_USER}: $${endUSD} USD`);
    console.log(`[Billing] Automatically deducted: -$${difference} USD from your universal wallet!`);

  } catch (error: any) {
    console.error("Client call failed:", error.message);
  }
}

main();
