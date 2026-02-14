import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { debugState, setResource404, setRuntimeError } from "./debug/debugStore";
import "./styles/fonts.css";
import "./style.css";

if (typeof window !== "undefined" && debugState.enabled) {
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target as HTMLElement | null;
      const maybeUrl =
        (target as HTMLImageElement | null)?.src ||
        (target as HTMLLinkElement | null)?.href ||
        (target as HTMLScriptElement | null)?.src ||
        "";
      if (maybeUrl && event.message === "") {
        setResource404(maybeUrl);
        console.error("[404_RESOURCE]", maybeUrl);
        return;
      }
      if (event.message) {
        setRuntimeError(event.message);
      }
    },
    true
  );
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    setRuntimeError(reason);
  });
}

createApp(App).use(createPinia()).use(router).mount("#app");
