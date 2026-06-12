import axios from "axios";
import { redisClient } from "../config/redis.js";
import { ExchangeService } from "../services/exchange.service.js";
// Helper for introducing tiny delays in mock stream emulation
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Proxy endpoint handler for SSE chat completions
export const handleChatCompletion = async (req, res) => {
    const { messages, model = "gpt-4o", stream = true, mock: reqMock } = req.body;
    const userId = req.userId;
    const walletId = req.walletId;
    if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid messages array format" });
        return;
    }
    // Segment provider type based on model name
    let provider = "openai";
    const modelLower = model.toLowerCase();
    if (modelLower.includes("claude") || modelLower.includes("anthropic")) {
        provider = "anthropic";
    }
    else if (modelLower.includes("flux")) {
        provider = "flux";
    }
    else if (modelLower.includes("eleven")) {
        provider = "elevenlabs";
    }
    // Determine if mock emulation should be active
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const isMockOpenAI = provider === "openai" && (!openaiKey || openaiKey.includes("your_secret"));
    const isMockAnthropic = provider === "anthropic" && (!anthropicKey || anthropicKey.includes("your_secret"));
    const useMock = reqMock === true || isMockOpenAI || isMockAnthropic;
    // Set SSE response headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    let inputTokens = 0;
    let outputTokens = 0;
    if (useMock) {
        console.log(`[ChatController] Emulating MOCK streaming completion for ${provider}/${model}`);
        // Estimate prompt tokens
        inputTokens = Math.round(messages.reduce((acc, msg) => acc + (msg.content?.length || 0) / 4, 0) + 12);
        try {
            const mockCompletion = "This is a mock response streaming in real-time from the Liquid Credits proxy gateway. This demonstrates token estimation, credit translation service math, Redis balance decrementing (DECRBY), and job queueing for the async PostgreSQL worker.";
            const words = mockCompletion.split(" ");
            outputTokens = words.length;
            if (provider === "openai") {
                for (let i = 0; i < words.length; i++) {
                    const chunk = {
                        id: `chatcmpl-mock-${Date.now()}`,
                        object: "chat.completion.chunk",
                        created: Math.floor(Date.now() / 1000),
                        model,
                        choices: [
                            {
                                index: 0,
                                delta: { content: words[i] + " " },
                                finish_reason: i === words.length - 1 ? "stop" : null,
                            },
                        ],
                    };
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                    await delay(30);
                }
                // Final usage chunk (include_usage: true option simulation)
                const usageChunk = {
                    id: `chatcmpl-mock-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model,
                    choices: [],
                    usage: {
                        prompt_tokens: inputTokens,
                        completion_tokens: outputTokens,
                        total_tokens: inputTokens + outputTokens,
                    },
                };
                res.write(`data: ${JSON.stringify(usageChunk)}\n\n`);
                res.write("data: [DONE]\n\n");
            }
            else {
                // Anthropic protocol emulation
                const messageStart = {
                    type: "message_start",
                    message: {
                        id: `msg_mock_${Date.now()}`,
                        type: "message",
                        role: "assistant",
                        content: [],
                        model,
                        usage: {
                            input_tokens: inputTokens,
                            output_tokens: 0,
                        },
                    },
                };
                res.write(`data: ${JSON.stringify(messageStart)}\n\n`);
                await delay(50);
                for (let i = 0; i < words.length; i++) {
                    const delta = {
                        type: "content_block_delta",
                        index: 0,
                        delta: {
                            type: "text_delta",
                            text: words[i] + " ",
                        },
                    };
                    res.write(`data: ${JSON.stringify(delta)}\n\n`);
                    await delay(30);
                }
                const messageDelta = {
                    type: "message_delta",
                    delta: { stop_reason: "end_turn" },
                    usage: { output_tokens: outputTokens },
                };
                res.write(`data: ${JSON.stringify(messageDelta)}\n\n`);
                await delay(50);
            }
            await processDeductionAndQueue();
            res.end();
        }
        catch (mockError) {
            console.error("[ChatController] Mock stream error:", mockError);
            res.end();
        }
    }
    else {
        // LIVE PROXY COMPLETIONS
        console.log(`[ChatController] Directing live completion proxy to ${provider}/${model}`);
        try {
            if (provider === "openai") {
                const response = await axios.post("https://api.openai.com/v1/chat/completions", {
                    model,
                    messages,
                    stream: true,
                    stream_options: { include_usage: true },
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${openaiKey}`,
                    },
                    responseType: "stream",
                });
                let streamBuffer = "";
                response.data.on("data", (chunk) => {
                    // Immediately pipe raw data to the client to guarantee low latency
                    res.write(chunk);
                    // Parse token counts from chunks in background
                    streamBuffer += chunk.toString("utf8");
                    const lines = streamBuffer.split("\n");
                    streamBuffer = lines.pop() || ""; // retain incomplete line in buffer
                    for (const line of lines) {
                        const cleanLine = line.trim();
                        if (cleanLine.startsWith("data:")) {
                            const dataValue = cleanLine.slice(5).trim();
                            if (dataValue === "[DONE]")
                                continue;
                            try {
                                const json = JSON.parse(dataValue);
                                if (json.usage) {
                                    inputTokens = json.usage.prompt_tokens || 0;
                                    outputTokens = json.usage.completion_tokens || 0;
                                }
                            }
                            catch { }
                        }
                    }
                });
                response.data.on("end", async () => {
                    // Check final buffer residue
                    const cleanLine = streamBuffer.trim();
                    if (cleanLine.startsWith("data:") && !cleanLine.includes("[DONE]")) {
                        try {
                            const json = JSON.parse(cleanLine.slice(5).trim());
                            if (json.usage) {
                                inputTokens = json.usage.prompt_tokens || 0;
                                outputTokens = json.usage.completion_tokens || 0;
                            }
                        }
                        catch { }
                    }
                    await processDeductionAndQueue();
                    res.end();
                });
                response.data.on("error", (err) => {
                    console.error("[ChatController] Live OpenAI stream error:", err);
                    res.end();
                });
            }
            else {
                // Anthropic Live Proxy
                const response = await axios.post("https://api.anthropic.com/v1/messages", {
                    model,
                    messages,
                    max_tokens: req.body.max_tokens || 1024,
                    stream: true,
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": anthropicKey,
                        "anthropic-version": "2023-06-01",
                    },
                    responseType: "stream",
                });
                let streamBuffer = "";
                response.data.on("data", (chunk) => {
                    res.write(chunk);
                    streamBuffer += chunk.toString("utf8");
                    const lines = streamBuffer.split("\n");
                    streamBuffer = lines.pop() || "";
                    for (const line of lines) {
                        const cleanLine = line.trim();
                        if (cleanLine.startsWith("data:")) {
                            try {
                                const json = JSON.parse(cleanLine.slice(5).trim());
                                if (json.type === "message_start" && json.message?.usage) {
                                    inputTokens = json.message.usage.input_tokens || 0;
                                }
                                else if (json.type === "message_delta" && json.usage) {
                                    outputTokens = json.usage.output_tokens || 0;
                                }
                            }
                            catch { }
                        }
                    }
                });
                response.data.on("end", async () => {
                    const cleanLine = streamBuffer.trim();
                    if (cleanLine.startsWith("data:")) {
                        try {
                            const json = JSON.parse(cleanLine.slice(5).trim());
                            if (json.type === "message_start" && json.message?.usage) {
                                inputTokens = json.message.usage.input_tokens || 0;
                            }
                            else if (json.type === "message_delta" && json.usage) {
                                outputTokens = json.usage.output_tokens || 0;
                            }
                        }
                        catch { }
                    }
                    await processDeductionAndQueue();
                    res.end();
                });
                response.data.on("error", (err) => {
                    console.error("[ChatController] Live Anthropic stream error:", err);
                    res.end();
                });
            }
        }
        catch (liveError) {
            console.error("[ChatController] Live upstream proxy failure:", liveError.message);
            res.write(`data: ${JSON.stringify({ error: `Upstream AI gateway failure: ${liveError.message}` })}\n\n`);
            res.end();
        }
    }
    // Deduct cache balance and queue ledger insert
    async function processDeductionAndQueue() {
        try {
            if (inputTokens === 0 && outputTokens === 0) {
                console.log("[ChatController] Usage is 0. Skipping debit step.");
                return;
            }
            // Compute credit costs
            const cost = ExchangeService.calculateCost(provider, model, { inputTokens, outputTokens });
            console.log(`[ChatController] Charging user ${userId}: ${cost} micro-credits (${inputTokens} in, ${outputTokens} out)`);
            // Atomic balance deduction in Redis
            const balanceKey = `wallet:${userId}:balance`;
            const updatedBalance = await redisClient.decrBy(balanceKey, Number(cost));
            console.log(`[ChatController] Redis balance decremented. New balance for ${userId}: ${updatedBalance}`);
            // Assemble background sync payload
            const syncJob = {
                userId,
                walletId,
                cost: cost.toString(), // represent bigint as string to ensure no precision loss in json
                provider,
                model,
                inputTokens,
                outputTokens,
                timestamp: new Date().toISOString(),
            };
            // Push into the Redis List acting as our sync queue
            await redisClient.rPush("balance_sync_queue", JSON.stringify(syncJob));
            console.log(`[ChatController] Balance sync task queued for user ${userId}`);
        }
        catch (chargeErr) {
            console.error("[ChatController] Failed to process charge / queue balance sync:", chargeErr);
        }
    }
};
//# sourceMappingURL=chat.controller.js.map