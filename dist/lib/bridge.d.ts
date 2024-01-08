import { BridgeCallId, BridgeCallData, Listener, BridgeMethod } from "./types";
declare enum BridgeCallType {
    NONE = "NONE",
    ASYNC = "ASYNC",
    LISTENER = "LISTENER"
}
declare class BridgeCall {
    readonly id: BridgeCallId;
    readonly name: string;
    data: BridgeCallData;
    readonly type: BridgeCallType;
    readonly successful = false;
    constructor(name: string);
}
export declare class BridgeInactiveError extends Error {
    constructor();
}
export declare class BridgeUnavailableError extends Error {
    constructor();
}
export declare class BridgeCallRemovedError extends Error {
    constructor();
}
export declare class Bridge {
    private connector;
    private bridgeCallMap;
    constructor(connector?: string);
    send(bridgeCall: BridgeCall): void;
    remove(id: BridgeCallId, silent?: boolean): boolean;
    clear(): void;
    canReceive(id: BridgeCallId): boolean;
    receive(bridgeCallJson: string): boolean;
}
export declare class BridgePlugin {
    private bridge;
    constructor(bridge: Bridge);
    addMethod(name: string, method: BridgeMethod): Promise<BridgeCallId>;
    asyncCall(name: string, data?: BridgeCallData): Promise<BridgeCallData>;
    listenerCall(name: string, listener: Listener<BridgeCallData>, data?: BridgeCallData): Promise<BridgeCallId>;
    removeCall(id: BridgeCallId): boolean;
}
export {};
