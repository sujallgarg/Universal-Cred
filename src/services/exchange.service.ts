export interface UsageData {
  inputTokens?: number;
  outputTokens?: number;
  images?: number;
  seconds?: number;
}

export class ExchangeService {
  /**
   * Calculates the cost of usage in micro-credits ($1 = 1,000,000 micro-credits).
   * Rates are internally scaled by 1,000 (to "milli-micro-credits") to support 
   * fractional cents without using floating point numbers.
   * 
   * @param provider The AI provider name (e.g., 'openai', 'anthropic', 'flux', 'elevenlabs')
   * @param model The specific model identifier
   * @param usage The usage quantities (tokens, images, or seconds)
   * @returns BigInt cost in micro-credits
   */
  public static calculateCost(provider: string, model: string, usage: UsageData): bigint {
    const prov = provider.toLowerCase();
    const mdl = model.toLowerCase();

    let milliMicroCredits = 0n;

    if (prov === "openai") {
      // Rates per token in milli-micro-credits (scaled by 1000)
      let inputRate = 5000n; // gpt-4o default: $5.00 / 1M tokens = 5 micro-credits/token
      let outputRate = 15000n; // gpt-4o default: $15.00 / 1M tokens = 15 micro-credits/token

      if (mdl.includes("mini")) {
        inputRate = 150n; // gpt-4o-mini: $0.15 / 1M tokens = 0.15 micro-credits/token
        outputRate = 600n; // gpt-4o-mini: $0.60 / 1M tokens = 0.60 micro-credits/token
      }

      const inputTokens = BigInt(usage.inputTokens || 0);
      const outputTokens = BigInt(usage.outputTokens || 0);

      milliMicroCredits = (inputTokens * inputRate) + (outputTokens * outputRate);

    } else if (prov === "anthropic") {
      let inputRate = 3000n; // claude-3-5-sonnet: $3.00 / 1M tokens = 3 micro-credits/token
      let outputRate = 15000n; // claude-3-5-sonnet: $15.00 / 1M tokens = 15 micro-credits/token

      if (mdl.includes("haiku")) {
        inputRate = 250n; // claude-3-haiku: $0.25 / 1M tokens = 0.25 micro-credits/token
        outputRate = 1250n; // claude-3-haiku: $1.25 / 1M tokens = 1.25 micro-credits/token
      }

      const inputTokens = BigInt(usage.inputTokens || 0);
      const outputTokens = BigInt(usage.outputTokens || 0);

      milliMicroCredits = (inputTokens * inputRate) + (outputTokens * outputRate);

    } else if (prov === "flux") {
      const imageRate = 30000000n; // flux-1-dev: $0.03 per image = 30,000 micro-credits/image
      const images = BigInt(usage.images || 0);
      milliMicroCredits = images * imageRate;

    } else if (prov === "elevenlabs") {
      const secondRate = 2000000n; // elevenlabs: $0.002 per second = 2,000 micro-credits/second
      const seconds = BigInt(usage.seconds || 0);
      milliMicroCredits = seconds * secondRate;

    } else {
      // Fallback default: charge using base OpenAI rates
      const inputTokens = BigInt(usage.inputTokens || 0);
      const outputTokens = BigInt(usage.outputTokens || 0);
      milliMicroCredits = (inputTokens * 5000n) + (outputTokens * 15000n);
    }

    // Convert back to micro-credits by dividing by 1000
    let microCredits = milliMicroCredits / 1000n;

    // Minimum charge of 1 micro-credit for any non-zero usage
    const hasAnyUsage = (usage.inputTokens || 0) > 0 || 
                         (usage.outputTokens || 0) > 0 || 
                         (usage.images || 0) > 0 || 
                         (usage.seconds || 0) > 0;
                         
    if (hasAnyUsage && microCredits === 0n) {
      microCredits = 1n;
    }

    return microCredits;
  }
}

export default ExchangeService;
