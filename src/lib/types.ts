export type Resolve<T> = (data: T | PromiseLike<T>) => void;
export type Reject<T> = (data: T) => void;
export type BridgeCallId = string;
export type BridgeCallData = string | null;
export type Listener<T> = (data: T, successful: boolean, error: Error | null) => void;
export type BridgeMethod = (data: BridgeCallData) => Promise<BridgeCallData>;
