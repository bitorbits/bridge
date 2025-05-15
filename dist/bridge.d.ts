export declare class Bridge {
  static ready(bridgeConfig?: IBridgeConfig): Promise<BridgeCallData>;
  static version(): string | undefined;
  private bridgeCallMap;
  private nativeVersion;
  private bridgeIsReady;
  private constructor();
  version(): string;
  ready(bridgeConfig?: IBridgeConfig): Promise<BridgeCallData>;
  isReady(): boolean;
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

declare class BridgeCall {
  readonly id: BridgeCallId;
  readonly name: string;
  data: BridgeCallData;
  readonly type: BridgeCallType;
  readonly successful = false;
  constructor(name: string);
}

export declare type BridgeCallData = string | null;

export declare type BridgeCallId = string;

declare enum BridgeCallType {
  NONE = "NONE",
  ASYNC = "ASYNC",
  LISTEN = "LISTEN",
}

export declare type BridgeMethod = (data: BridgeCallData) => Promise<BridgeCallData>;

export declare abstract class BridgePlugin {
  private bridge;
  private methodMap;
  ready(bridge: Bridge): Promise<void>;
  abstract name(): string;
  private getName;
  isReady(): boolean;
  protected method(name: string, method: BridgeMethod): void;
  protected async(name: string, data?: BridgeCallData): Promise<BridgeCallData>;
  protected listen(name: string, listen: Listen<BridgeCallData>, data?: BridgeCallData): Promise<string>;
  unlisten(id: string): boolean;
}

declare interface IBridgeConfig {
  data?: string;
  plugins?: BridgePlugin[];
}

export declare type Listen<T> = (data: T, successful: boolean, error: Error | null) => void;

export declare type Reject<T> = (data: T) => void;

export declare type Resolve<T> = (data: T | PromiseLike<T>) => void;

export { };

declare global {
  interface Window {
    bridge?: Bridge;
    native?: {
      process(bridgeCallJson: string): boolean;
    };
  }
}
