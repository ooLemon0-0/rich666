import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import DebugOverlay from "./debug/DebugOverlay.vue";
import { setLastResource404, setRuntimeError } from "./debug/debugStore";
import "./styles/fonts.css";
import "./style.css";

function installDebugInstrumentation(): void {
  if (!new URLSearchParams(window.location.search).has("debug")) {
    return;
  }
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target as (HTMLElement & { src?: string; href?: string }) | null;
      const url = target?.src || target?.href || "";
      if (url) {
        if (url.includes(".js") || url.includes(".css") || url.includes(".png") || url.includes(".svg")) {
          const msg = `[404_RESOURCE] ${url}`;
          console.error(msg);
          setLastResource404(url);
        }
      } else if (event.message) {
        setRuntimeError(event.message);
      }
    },
    true
  );
}

installDebugInstrumentation();

const app = createApp(App).use(createPinia()).use(router);
app.component("DebugOverlay", DebugOverlay);
app.mount("#app");
