<script setup lang="ts">
import { computed } from "vue";
import type { PublicGameState } from "../../shared/game";

const props = defineProps<{
  gameState: PublicGameState;
}>();

const emit = defineEmits<{
  (e: "rematch"): void;
  (e: "home"): void;
  (e: "view-profile"): void;
}>();

const isWin = computed(() => props.gameState.winnerId === props.gameState.yourPlayerId);
const isDraw = computed(() => props.gameState.winnerId === null);
const isLose = computed(() => !isWin.value && !isDraw.value);

const resultType = computed<"win" | "lose" | "draw">(() => {
  if (isWin.value) return "win";
  if (isDraw.value) return "draw";
  return "lose";
});

const resultTitle = computed(() => {
  if (isWin.value) return "VICTORY";
  if (isDraw.value) return "DRAW";
  return "DEFEAT";
});

const bannerColorClass = computed(() => {
  if (isWin.value) return "text-[#3FB950] border-[#3FB950]/50 crt-glow-green";
  if (isDraw.value) return "text-[#F1C40F] border-[#F1C40F]/50 crt-glow-amber";
  return "text-[#E74C3C] border-[#E74C3C]/50 crt-glow-red";
});

const endReasonLabel = computed(() => {
  switch (props.gameState.endReason) {
    case "death":
      return "TACTICAL MINE DETONATED (KNOCKOUT)";
    case "timeout":
      return "CHRONO EXHAUSTION / TIMEOUT (KNOCKOUT)";
    case "score":
      return "ALL SECTORS SECURED (HIGH SCORE)";
    case "surrender":
      return "ENEMY FORCE SURRENDERED";
    default:
      return "OPERATION CONCLUDED";
  }
});

const you = computed(() => {
  return (
    props.gameState.players.find((p) => p.id === props.gameState.yourPlayerId) ||
    props.gameState.players[0]
  );
});

const opponent = computed(() => {
  return (
    props.gameState.players.find((p) => p.id !== props.gameState.yourPlayerId) ||
    props.gameState.players[1]
  );
});

const yourParticipant = computed(() => {
  return props.gameState.matchResult?.participants?.find(
    (p: any) => p.userId === props.gameState.yourPlayerId,
  );
});

const opponentParticipant = computed(() => {
  return props.gameState.matchResult?.participants?.find(
    (p: any) => p.userId !== props.gameState.yourPlayerId,
  );
});

const ratingDiffDisplay = computed(() => {
  if (!yourParticipant.value) return "±0";
  const diff = yourParticipant.value.ratingDiff;
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return "±0";
});

const ratingDiffColor = computed(() => {
  if (!yourParticipant.value) return "text-gray-400";
  const diff = yourParticipant.value.ratingDiff;
  if (diff > 0) return "text-[#3FB950]";
  if (diff < 0) return "text-[#E74C3C]";
  return "text-gray-400";
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div class="w-full max-w-lg bg-[#161B22] border-2 border-[#30363D] rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-sans crt-screen">
      <!-- Background tactical scan lines effect -->
      <div class="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#58A6FF_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <!-- Top Terminal Header -->
      <div class="flex items-center justify-between border-b border-[#30363D] pb-3 mb-6 font-mono-crt text-xs text-gray-400">
        <span class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-[#58A6FF] animate-pulse"></span>
          MISSION REPORT // SUMMARY
        </span>
        <span class="text-gray-500">
          SECTOR 16x16
        </span>
      </div>
      <!-- Main Result Banner -->
      <div class="text-center my-4">
        <div
          class="text-4xl sm:text-5xl font-black font-mono-crt tracking-widest inline-block px-8 py-3 rounded-lg border-2 bg-black/40"
          data-testid="result-banner"
          :class="bannerColorClass"
        >
          {{ resultTitle }}
        </div>
        <p class="mt-3 text-xs font-mono-crt text-gray-400 tracking-wider">
          {{ endReasonLabel }}
        </p>
      </div>
      <!-- Score & Status Comparison -->
      <div class="grid grid-cols-2 gap-4 my-6 font-mono-crt">
        <!-- Player Stats Card -->
        <div class="bg-black/40 border border-[#30363D] rounded-lg p-4 text-center relative">
          <span class="absolute top-2 left-2 text-[10px] text-[#58A6FF] px-1.5 py-0.5 rounded bg-[#58A6FF]/10 border border-[#58A6FF]/20">
            YOU
          </span>
          <div class="text-sm font-bold text-gray-200 mt-2 truncate">
            {{ you.name }}
          </div>
          <div class="text-3xl font-black text-[#58A6FF] my-1">
            {{ you.score }}
            <span class="text-xs font-normal text-gray-400">
              PTS
            </span>
          </div>
          <div class="text-xs text-gray-400 flex justify-center items-center gap-1">
            LIVES:
            <span class="text-[#E74C3C] font-bold">
              {{ you.lives }} ❤️
            </span>
          </div>
        </div>
        <!-- Opponent Stats Card -->
        <div class="bg-black/40 border border-[#30363D] rounded-lg p-4 text-center relative">
          <span class="absolute top-2 left-2 text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">
            RIVAL
          </span>
          <div class="text-sm font-bold text-gray-200 mt-2 truncate">
            {{ opponent.name }}
          </div>
          <div class="text-3xl font-black text-gray-300 my-1">
            {{ opponent.score }}
            <span class="text-xs font-normal text-gray-400">
              PTS
            </span>
          </div>
          <div class="text-xs text-gray-400 flex justify-center items-center gap-1">
            LIVES:
            <span class="text-[#E74C3C] font-bold">
              {{ opponent.lives }} ❤️
            </span>
          </div>
        </div>
      </div>
      <!-- Rating Adjustment Section -->
      <div
        v-if="yourParticipant"
        class="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 mb-6 flex items-center justify-between font-mono-crt"
      >
        <div>
          <span class="text-xs text-gray-400 block">
            TACTICAL RATING ADJUSTMENT
          </span>
          <div class="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
            <span>
              {{ yourParticipant.initialRating }}
            </span>
            <span class="text-gray-500">
              ➔
            </span>
            <span class="text-[#58A6FF] font-black text-xl">
              {{ yourParticipant.newRating }}
            </span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-gray-500 block">
            NET DIFF
          </span>
          <span class="text-xl font-black" :class="ratingDiffColor">
            {{ ratingDiffDisplay }}
          </span>
        </div>
      </div>
      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 font-mono-crt">
        <button
          class="flex-1 py-3 px-4 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded-lg text-sm transition-all duration-200 shadow-lg shadow-[#238636]/20 active:scale-[0.98] border border-[#3fb950]/50"
          data-testid="rematch-btn"
          type="button"
          @click='emit("rematch")'
        >
          RE-ENGAGE (REMATCH)
        </button>
        <button
          class="py-3 px-4 bg-[#1f242c] hover:bg-[#282f3a] text-gray-300 hover:text-white font-bold rounded-lg text-sm transition-all duration-200 border border-[#30363D]"
          data-testid="view-profile-btn"
          type="button"
          @click='emit("view-profile")'
        >
          DOSSIER
        </button>
        <button
          class="py-3 px-4 bg-[#0d1117] hover:bg-[#161b22] text-gray-400 hover:text-gray-200 font-bold rounded-lg text-sm transition-all duration-200 border border-[#30363D]"
          data-testid="result-home-btn"
          type="button"
          @click='emit("home")'
        >
          TERMINAL
        </button>
      </div>
    </div>
  </div>
</template>
