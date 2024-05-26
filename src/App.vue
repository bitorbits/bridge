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

window.addEventListener("BridgeReady", (event: any) => {
  console.log(event.detail);
});

class App extends BridgePlugin {
  constructor() {
    super();
    this.method("App.invoke", this.invoke);
  }

  private async invoke(_data: BridgeCallData) {
    data.value = `${_data}`;
    return "Hello from WebView";
  }

  async toast(message: string) {
    await this.async("App.toast", message);
  }
}

const app = new App();

onMounted(async () => {
  try {
    await Bridge.ready({
      data: "BridgeData",
      plugins: [app],
    });

    await app.toast("onMounted");

    setInterval(() => {
      app.toast("Random " + Math.random());
    }, 2000);
  } catch (error) {
    console.log(error);
  }
});
</script>
