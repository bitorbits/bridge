import { BridgeCallId, BridgeCallData, Listen, BridgeMethod } from './types';

interface IBridgeConfig {
    data?: string;
    plugins?: BridgePlugin[];
}
declare enum BridgeCallType {
    NONE = "NONE",
    ASYNC = "ASYNC",
    LISTEN = "LISTEN"
}
declare class BridgeCall {
    readonly id: BridgeCallId;
    readonly name: string;
    data: BridgeCallData;
    readonly type: BridgeCallType;
    readonly successful = false;
    constructor(name: string);
}
export declare class Bridge {
    static ready(bridgeConfig?: IBridgeConfig): Promise<void>;
    private bridgeCallMap;
    constructor();
    ready(bridgeConfig?: IBridgeConfig): Promise<BridgeCallData>;
    send(bridgeCall: BridgeCall): void;
    remove(id: BridgeCallId, silent?: boolean): boolean;
    clear(): void;
    canReceive(id: BridgeCallId): boolean;
    receive(bridgeCallJson: string): boolean;
    method(name: string, method: BridgeMethod): Promise<BridgeCallId>;
    async(name: string, data?: BridgeCallData): Promise<BridgeCallData>;
    listen(name: string, listen: Listen<BridgeCallData>, data?: BridgeCallData): Promise<BridgeCallId>;
    unlisten(id: BridgeCallId): boolean;
}
export declare class BridgePlugin {
    private bridge;
    private methodMap;
    ready(bridge: Bridge): Promise<void>;
    protected method(name: string, method: BridgeMethod): void;
    protected async(name: string, data?: BridgeCallData): Promise<BridgeCallData>;
    protected listen(name: string, listen: Listen<BridgeCallData>, data?: BridgeCallData): Promise<string>;
    protected unlisten(id: string): boolean;
}
export {};
