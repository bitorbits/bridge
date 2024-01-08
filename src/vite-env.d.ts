/// <reference types="vite/client" />
import { Bridge } from "./lib/bridge";

declare global {
  interface Window {
    bridge: Bridge;
    native: {
      process(bridgeCallJson: string): boolean;
    };
  }
}
