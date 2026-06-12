export declare const redisClient: {
    isOpen: boolean;
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<string | null>;
    decrBy: (key: string, value: number) => Promise<number>;
    rPush: (key: string, value: string) => Promise<number>;
    lPush: (key: string, value: string) => Promise<number>;
    blPop: (key: string, timeout: number) => Promise<{
        key: string;
        element: string;
    } | null>;
    ping: () => Promise<string>;
};
export declare const connectRedis: () => Promise<void>;
export default redisClient;
//# sourceMappingURL=redis.d.ts.map