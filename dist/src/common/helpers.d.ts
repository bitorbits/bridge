export declare const delay: (ms: number) => Promise<unknown>;
export declare const launch: <T>(block: () => Promise<T>) => Promise<T>;
