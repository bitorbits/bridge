<template>
  <div>
    <h1>{{ data }}</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Bridge, BridgePlugin, BridgeCallData } from "./bridge";
import { delay } from "./common/helpers";

const data = ref("loading");

class App extends BridgePlugin {
  name(): string {
    return "App";
  }

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

  async random(cb: (data: BridgeCallData) => void) {
    return this.listen(this.random.name, cb);
  }
}

const app = new App();

onMounted(async () => {
  try {
    await Bridge.ready({
      data: "BridgeData",
      plugins: [app],
    });

    const id = await app.random((value) => {
      data.value = value as string;
    });

    await delay(10000);

    app.unlisten(id);

    await app.toast("onMounted");
  } catch (error) {
    console.log(error);
  }
});
</script>
