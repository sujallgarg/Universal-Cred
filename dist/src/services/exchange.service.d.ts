export interface UsageData {
    inputTokens?: number;
    outputTokens?: number;
    images?: number;
    seconds?: number;
}
export declare class ExchangeService {
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
    static calculateCost(provider: string, model: string, usage: UsageData): bigint;
}
export default ExchangeService;
//# sourceMappingURL=exchange.service.d.ts.map