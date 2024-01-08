<template>
  <div>
    <h1>{{ data }}</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Bridge, BridgePlugin } from "./lib/bridge";
import { BridgeCallData } from "./lib/types";

const data = ref("loading");

window.bridge = new Bridge();

class App extends BridgePlugin {
  constructor(bridge: Bridge) {
    super(bridge);
    this.addMethod("app.invoke_from_android", this.invokeFromAndroid);
  }

  private async invokeFromAndroid(_data: BridgeCallData) {
    data.value = "invokeFromAndroid = " + _data;
    return "data from webview";
  }

  async toast(message: string) {
    this.asyncCall("app.toast", message);
  }
}

const app = new App(window.bridge);

onMounted(async () => {
  app.toast("onMounted");

  setInterval(() => {
    app.toast("Random " + Math.random());
  }, 2000);
});
</script>
