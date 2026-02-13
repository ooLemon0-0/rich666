import { createRouter, createWebHashHistory } from "vue-router";
import LobbyView from "../views/LobbyView.vue";
import RoomEntryView from "../views/RoomEntryView.vue";
import WaitingRoomView from "../views/WaitingRoomView.vue";
import GameView from "../views/GameView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "lobby",
      component: LobbyView
    },
    {
      path: "/waiting",
      name: "waiting",
      component: WaitingRoomView
    },
    {
      path: "/game/:roomId",
      name: "game",
      component: GameView
    },
    {
      path: "/room/:roomId",
      name: "room-entry",
      component: RoomEntryView
    }
  ]
});
