import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
import { GAME_CONFIG } from "./config/game";

document.title = GAME_CONFIG.title;
createApp(App).use(createPinia()).mount("#app");
