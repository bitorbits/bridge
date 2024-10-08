import { v4 as uuidv4 } from "uuid";

declare global {
  interface Window {
    bridge?: Bridge;
    native?: {
      process(bridgeCallJson: string): boolean;
    };
  }
}

export type Resolve<T> = (data: T | PromiseLike<T>) => void;
export type Reject<T> = (data: T) => void;
export type BridgeCallId = string;
export type BridgeCallData = string | null;
export type Listen<T> = (data: T, successful: boolean, error: Error | null) => void;
export type BridgeMethod = (data: BridgeCallData) => Promise<BridgeCallData>;

interface IBridgeConfig {
  data?: string;
  plugins?: BridgePlugin[];
}

enum BridgeCallType {
  NONE = "NONE",
  ASYNC = "ASYNC",
  LISTEN = "LISTEN",
}

class BridgeCall {
  readonly id: BridgeCallId = uuidv4();
  readonly name: string;
  data: BridgeCallData = null;
  readonly type: BridgeCallType = BridgeCallType.NONE;
  readonly successful = false;
  constructor(name: string) {
    this.name = name;
  }
}

class AsyncBridgeCall<T> extends BridgeCall {
  type = BridgeCallType.ASYNC;
  readonly resolve: Resolve<T>;
  readonly reject: Reject<T>;
  constructor(name: string, resolve: Resolve<T>, reject: Reject<T>) {
    super(name);
    this.resolve = resolve;
    this.reject = reject;
  }
}

class ListenBridgeCall<T> extends BridgeCall {
  type = BridgeCallType.LISTEN;
  readonly listen: Listen<T>;
  constructor(name: string, listen: Listen<T>) {
    super(name);
    this.listen = listen;
  }
}

class BridgeError extends Error {
  constructor(error: string = "BridgeError", message: string = "") {
    super((error + " " + message).trim());
  }
}

class BridgeVersionError extends BridgeError {
  constructor(message: string = "") {
    super("BridgeVersionError", message);
  }
}

class BridgeInactiveError extends BridgeError {
  constructor(message: string = "") {
    super("BridgeInactiveError", message);
  }
}

class BridgeUnavailableError extends BridgeError {
  constructor(message: string = "") {
    super("BridgeUnavailableError", message);
  }
}

class BridgeCallRemovedError extends BridgeError {
  constructor(message: string = "") {
    super("BridgeCallRemovedError", message);
  }
}

class BridgePlugInNotReadyError extends BridgeError {
  constructor(message: string = "") {
    super("BridgePlugInNotReadyError", message);
  }
}

const defaultBridgeConfig: IBridgeConfig = {
  data: "",
  plugins: [],
};

export class Bridge {
  static async ready(bridgeConfig: IBridgeConfig = defaultBridgeConfig) {
    window.bridge = new Bridge();
    return await window.bridge.ready(bridgeConfig);
  }

  static version() {
    return window.bridge?.version();
  }

  private bridgeCallMap = new Map<BridgeCallId, BridgeCall>();
  private nativeVersion: string | null = null;
  private bridgeIsReady = false;

  private constructor() {}

  version() {
    return __VERSION__;
  }

  async ready(bridgeConfig: IBridgeConfig = defaultBridgeConfig) {
    if (this.bridgeIsReady) return null;

    const data = bridgeConfig.data ?? defaultBridgeConfig.data!;
    const plugins = bridgeConfig.plugins ?? defaultBridgeConfig.plugins!;

    window.dispatchEvent(new CustomEvent("BridgeInit"));

    await this.async("Bridge.init", data);

    for (let plugin of plugins) {
      await plugin.ready(this);
    }

    const result = await this.async("Bridge.ready", data);

    window.dispatchEvent(new CustomEvent("BridgeReady", { detail: result }));

    this.bridgeIsReady = true;

    return result;
  }

  isReady() {
    return this.bridgeIsReady;
  }

  send(bridgeCall: BridgeCall): void {
    this.bridgeCallMap.set(bridgeCall.id, bridgeCall);
    const connector = "native";
    // eslint-disable-next-line no-prototype-builtins
    if (window.hasOwnProperty(connector)) {
      const connectorInstance = window[connector as keyof Window];
      try {
        try {
          if (this.nativeVersion === null) {
            this.nativeVersion = connectorInstance.version();
          }
        } catch (error) {
          this.remove(bridgeCall.id);
          throw new BridgeInactiveError(bridgeCall.name);
        }

        if (this.version() !== this.nativeVersion) {
          this.remove(bridgeCall.id);
          throw new BridgeVersionError(`${bridgeCall.name} js(${this.version()}) native(${this.nativeVersion})`);
        }

        if (!connectorInstance!.process(JSON.stringify(bridgeCall))) {
          this.remove(bridgeCall.id);
          throw new BridgeInactiveError(bridgeCall.name);
        }
      } catch (error) {
        this.remove(bridgeCall.id);
        throw error;
      }
    } else {
      this.remove(bridgeCall.id);
      throw new BridgeUnavailableError(bridgeCall.name);
    }
  }

  remove(id: BridgeCallId, silent = true): boolean {
    if (!silent) {
      const call = this.bridgeCallMap.get(id);
      if (call !== undefined) {
        if (call instanceof AsyncBridgeCall) {
          call.reject(new BridgeCallRemovedError(call.name));
        } else if (call instanceof ListenBridgeCall) {
          call.listen(null, false, new BridgeCallRemovedError(call.name));
        }
      }
    }
    return this.bridgeCallMap.delete(id);
  }

  clear(): void {
    this.bridgeCallMap.forEach((call) => {
      if (call instanceof AsyncBridgeCall) {
        call.reject(new BridgeCallRemovedError(call.name));
      } else if (call instanceof ListenBridgeCall) {
        call.listen(null, false, new BridgeCallRemovedError(call.name));
      }
    });
    this.bridgeCallMap.clear();
  }

  canReceive(id: BridgeCallId): boolean {
    return this.bridgeCallMap.has(id);
  }

  receive(bridgeCallJson: string): boolean {
    try {
      const bridgeCall = JSON.parse(atob(bridgeCallJson)) as BridgeCall;
      const call = this.bridgeCallMap.get(bridgeCall.id);
      if (call === undefined) return false;
      if (call instanceof AsyncBridgeCall) {
        if (bridgeCall.successful) {
          call.resolve(bridgeCall.data);
        } else {
          call.reject(bridgeCall.data);
        }
        this.remove(call.id);
      } else if (call instanceof ListenBridgeCall) {
        call.listen(bridgeCall.data, bridgeCall.successful, null);
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  method(name: string, method: BridgeMethod): Promise<BridgeCallId> {
    return this.listen(`${name}.invoke`, (args: BridgeCallData) => {
      method(args)
        .then((returnData) => {
          this.async(`${name}.return`, returnData).catch((error) => console.error(error));
        })
        .catch((error) => {
          let message = error;
          if (error instanceof Error) {
            message = error.message;
          }
          this.async(`${name}.error`, message).catch((error) => console.error(error));
        });
    });
  }

  async(name: string, data: BridgeCallData = null): Promise<BridgeCallData> {
    return new Promise((resolve, reject) => {
      const call = new AsyncBridgeCall(name, resolve, reject);
      call.data = data;
      try {
        this.send(call);
      } catch (error) {
        reject(error);
      }
    });
  }

  listen(name: string, listen: Listen<BridgeCallData>, data: BridgeCallData = null): Promise<BridgeCallId> {
    return new Promise((resolve, reject) => {
      const call = new ListenBridgeCall(name, listen);
      call.data = data;
      try {
        this.send(call);
        resolve(call.id);
      } catch (error) {
        reject(error);
      }
    });
  }

  unlisten(id: BridgeCallId): boolean {
    return this.remove(id, false);
  }
}

export abstract class BridgePlugin {
  private bridge: Bridge | null = null;
  private methodMap = new Map<string, BridgeMethod>();

  async ready(bridge: Bridge) {
    this.bridge = bridge;

    for (let [name, method] of this.methodMap) {
      await this.bridge.method(name, method);
    }
  }

  abstract name(): string;

  private getName(name: string) {
    const trimmedName = this.name().trim();
    const list = [trimmedName === "" ? null : trimmedName, name.trim()].filter((value) => value !== null);
    return list.join(".");
  }

  isReady() {
    return this.bridge !== null && this.bridge.isReady();
  }

  protected method(name: string, method: BridgeMethod): void {
    this.methodMap.set(this.getName(name), method);
  }

  protected async async(name: string, data: BridgeCallData = null): Promise<BridgeCallData> {
    const _name = this.getName(name);
    if (!this.isReady()) {
      throw new BridgePlugInNotReadyError(_name);
    }
    return this.bridge!.async(_name, data);
  }

  protected listen(name: string, listen: Listen<BridgeCallData>, data: BridgeCallData = null): Promise<string> {
    const _name = this.getName(name);
    if (!this.isReady()) {
      throw new BridgePlugInNotReadyError(_name);
    }
    return this.bridge!.listen(_name, listen, data);
  }

  unlisten(id: string): boolean {
    if (!this.isReady()) {
      return false;
    } else {
      return this.bridge!.unlisten(id);
    }
  }
}
