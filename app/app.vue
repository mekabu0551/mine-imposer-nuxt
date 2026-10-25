<script setup lang="ts">
import { ref, shallowRef, computed } from "vue";
import HomeScreen from "./components/HomeScreen.vue";
import GameBoard from "./components/GameBoard.vue";
import { useUser } from "./composables/useUser";
import { useGameSocket } from "./composables/useGameSocket";

const { user } = useUser();
const currentPage = ref<"home" | "random" | "private">("home");
const currentRoomId = ref<string>("room-casual-1");
const activeSocket = shallowRef<ReturnType<typeof useGameSocket> | null>(null);

const isPlaying = computed(() => activeSocket.value?.gameState.value?.status === "playing");
const currentGameState = computed(() => activeSocket.value?.gameState.value ?? null);
const isSocketConnected = computed(() => activeSocket.value?.isConnected.value ?? false);

const handleSelectMode = (mode: "random" | "private") => {
  currentPage.value = mode;
  currentRoomId.value = mode === "random" ? "room-casual-1" : "room-private-alpha";

  const socket = useGameSocket(currentRoomId.value, {
    id: user.value.id,
    name: user.value.username,
  });

  activeSocket.value = socket;
  socket.connect();
};

const backToHome = () => {
  activeSocket.value?.disconnect();
  activeSocket.value = null;
  currentPage.value = "home";
};

const handleOpen = (payload: { row: number; col: number }) => {
  activeSocket.value?.openCell(payload.row, payload.col);
};

const handleFlag = (payload: { row: number; col: number }) => {
  activeSocket.value?.toggleFlag(payload.row, payload.col);
};
</script>

<template>
  <div class="min-h-screen bg-[#0D1117] text-[#F0F6FC]">
    <HomeScreen v-if='currentPage === "home"' @select-mode="handleSelectMode" />
    <div
      v-else
      class="min-h-screen flex flex-col justify-center items-center crt-screen p-4 font-sans"
    >
      <!-- ゲームが開始されている場合は GameBoard を表示 -->
      <template v-if="isPlaying && currentGameState">
        <GameBoard :game-state="currentGameState" @flag="handleFlag" @open="handleOpen" />
        <div class="mt-4">
          <button
            class="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs transition duration-200 font-mono-crt text-gray-400 hover:text-white"
            data-testid="return-home-btn"
            type="button"
            @click="backToHome"
          >
            TERMINATE & RETURN
          </button>
        </div>
      </template>
      <!-- 待機中または接続中の画面 -->
      <div
        v-else
        class="bg-[#161B22] border border-[#30363D] p-8 rounded-lg max-w-md w-full text-center cell-inset"
      >
        <h2 class="text-xl font-bold text-[#F1C40F] crt-glow-amber mb-4 uppercase font-mono-crt">
          [ MATCH PROTOCOL: {{ currentPage.toUpperCase() }} ]
        </h2>
        <div class="my-6 flex flex-col items-center">
          <div class="w-12 h-12 border-4 border-[#58A6FF]/20 border-t-[#58A6FF] rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-mono-crt text-gray-300">
            {{ isSocketConnected ? "WAITING FOR OPPONENT..." : "CONNECTING TO TACTICAL SERVER..." }}
          </p>
          <p class="text-xs text-gray-500 font-mono-crt mt-1">
            ROOM: {{ currentRoomId }}
          </p>
        </div>
        <button
          class="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-sm transition duration-200 font-mono-crt text-gray-300"
          data-testid="return-home-btn"
          type="button"
          @click="backToHome"
        >
          Return to Terminal
        </button>
      </div>
    </div>
  </div>
</template>
