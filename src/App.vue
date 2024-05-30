<template>
  <div>
    <h1>{{ data }}</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Bridge, BridgePlugin, BridgeCallData } from "./bridge";

const data = ref("loading");

class App extends BridgePlugin {
  constructor() {
    super();
    this.method(this.invoke.name, this.invoke);
  }

  private async invoke(_data: BridgeCallData) {
    data.value = `${_data}`;
    return "Hello from WebView";
  }

  async toast(message: string) {
    await this.async(this.toast.name, message);
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
  } catch (error) {
    console.log(error);
  }
});
</script>
