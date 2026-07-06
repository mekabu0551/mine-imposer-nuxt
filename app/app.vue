<template>
  <div class="min-h-screen bg-[#0D1117]">
    <!-- 一時的に currentPage のステートを用いて画面を切り替えられるようにする -->
    <HomeScreen v-if="currentPage === 'home'" @select-mode="handleSelectMode" />
    <div v-else class="min-h-screen flex flex-col justify-center items-center text-[#F0F6FC] crt-screen p-6 font-sans">
      <div class="bg-[#161B22] border border-[#30363D] p-8 rounded-lg max-w-md w-full text-center cell-inset">
        <h2 class="text-xl font-bold text-[#F1C40F] crt-glow-amber mb-4 uppercase font-mono-crt">[ Connecting to Protocol ]</h2>
        <p class="text-sm text-gray-400 mb-6 font-mono-crt">Mode: {{ currentPage.toUpperCase() }}</p>
        <p class="text-xs text-gray-500 mb-6">次のフェーズで対戦相手との接続(Durable Objects)を実装します。</p>
        <button @click="backToHome" class="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-sm transition duration-200 font-mono-crt">
          Return to Terminal
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import HomeScreen from "./components/HomeScreen.vue";

const currentPage = ref<"home" | "random" | "private">("home");

const handleSelectMode = (mode: "random" | "private") => {
  currentPage.value = mode;
};

const backToHome = () => {
  currentPage.value = "home";
};
</script>
