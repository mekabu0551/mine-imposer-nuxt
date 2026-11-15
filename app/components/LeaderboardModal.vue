<script setup lang="ts">
import { computed } from "vue";
import type { LeaderboardEntry } from "../composables/useLeaderboard";

const props = defineProps<{
  leaderboard: LeaderboardEntry[];
  loading?: boolean;
  error?: string | null;
  currentUserId?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "refresh"): void;
}>();

const topThree = computed(() => props.leaderboard.slice(0, 3));

const getRankBadgeClass = (rank: number) => {
  if (rank === 1) return "bg-[#F1C40F]/20 text-[#F1C40F] border-[#F1C40F] crt-glow-amber";
  if (rank === 2) return "bg-[#58A6FF]/20 text-[#58A6FF] border-[#58A6FF] crt-glow-blue";
  if (rank === 3) return "bg-[#3FB950]/20 text-[#3FB950] border-[#3FB950]";
  return "bg-gray-800 text-gray-400 border-gray-700";
};

const getRankSymbol = (rank: number) => {
  if (rank === 1) return "🥇 01";
  if (rank === 2) return "🥈 02";
  if (rank === 3) return "🥉 03";
  return rank < 10 ? `0${rank}` : `${rank}`;
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    data-testid="leaderboard-modal-backdrop"
    @click.self='emit("close")'
  >
    <div class="w-full max-w-3xl bg-[#161B22] border-2 border-[#30363D] rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-sans crt-screen max-h-[90vh] flex flex-col">
      <!-- Top Terminal Header -->
      <div class="flex items-center justify-between border-b border-[#30363D] pb-3 mb-6 font-mono-crt text-xs text-gray-400">
        <span class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-[#58A6FF] animate-pulse"></span>
          GLOBAL RANKINGS // ELO LEADERBOARD
        </span>
        <div class="flex items-center gap-2">
          <button
            class="text-gray-400 hover:text-white px-2 py-1 bg-gray-800/80 rounded border border-gray-600 transition flex items-center gap-1 text-xs"
            data-testid="refresh-leaderboard-btn"
            type="button"
            :disabled="loading"
            @click='emit("refresh")'
          >
            <span :class='{ "animate-spin": loading }'>
              ↻
            </span>
            REFRESH
          </button>
          <button
            class="text-gray-400 hover:text-white px-2 py-1 bg-gray-800/80 rounded border border-gray-600 transition text-xs"
            data-testid="close-leaderboard-btn"
            type="button"
            @click='emit("close")'
          >
            ✕ CLOSE
          </button>
        </div>
      </div>
      <!-- Loading State -->
      <div
        v-if="loading"
        class="py-16 text-center font-mono-crt text-gray-400 flex flex-col items-center justify-center gap-4"
        data-testid="leaderboard-loading"
      >
        <div class="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin"></div>
        <div class="tracking-widest text-sm text-[#58A6FF] animate-pulse">
          SCANNING SATELLITE TELEMETRY...
        </div>
      </div>
      <!-- Error State -->
      <div
        v-else-if="error"
        class="py-12 px-6 text-center font-mono-crt bg-[#E74C3C]/10 border border-[#E74C3C]/40 rounded-lg text-[#E74C3C] my-4"
        data-testid="leaderboard-error"
      >
        <div class="text-lg font-bold mb-2">
          COMMUNICATION INTERRUPTED
        </div>
        <div class="text-xs text-gray-300">
          {{ error }}
        </div>
        <button
          class="mt-4 px-4 py-1.5 bg-[#E74C3C]/20 hover:bg-[#E74C3C]/30 text-white rounded border border-[#E74C3C] text-xs transition"
          type="button"
          @click='emit("refresh")'
        >
          RETRY UPLINK
        </button>
      </div>
      <!-- Leaderboard Content -->
      <div v-else class="overflow-y-auto pr-1 flex-1 flex flex-col">
        <!-- Top 3 Podium Highlights -->
        <div v-if="topThree.length >= 3" class="grid grid-cols-3 gap-3 mb-6 font-mono-crt">
          <!-- 2nd Place -->
          <div class="bg-[#0D1117] border border-[#58A6FF]/40 rounded-lg p-3 text-center flex flex-col items-center justify-between order-1">
            <div class="text-[10px] text-gray-400 uppercase tracking-widest">
              RANK 02
            </div>
            <div class="w-8 h-8 rounded-full bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF] flex items-center justify-center font-bold text-sm my-1">
              🥈
            </div>
            <div class="font-bold text-white text-xs truncate max-w-full px-1">
              {{ topThree[1].username }}
            </div>
            <div class="text-[#58A6FF] font-black text-base crt-glow-blue mt-1">
              {{ topThree[1].rating }}
            </div>
            <div class="text-[10px] text-gray-500 mt-1">
              {{ topThree[1].winRate }}% WR
            </div>
          </div>
          <!-- 1st Place -->
          <div class="bg-[#0D1117] border-2 border-[#F1C40F] rounded-lg p-3.5 text-center flex flex-col items-center justify-between order-0 sm:order-1 -mt-2 shadow-lg shadow-[#F1C40F]/10">
            <div class="text-[10px] text-[#F1C40F] uppercase tracking-widest font-black">
              CHAMPION
            </div>
            <div class="w-10 h-10 rounded-full bg-[#F1C40F]/20 text-[#F1C40F] border-2 border-[#F1C40F] flex items-center justify-center font-black text-lg my-1 crt-glow-amber">
              🥇
            </div>
            <div class="font-black text-white text-sm truncate max-w-full px-1">
              {{ topThree[0].username }}
            </div>
            <div class="text-[#F1C40F] font-black text-xl crt-glow-amber mt-1">
              {{ topThree[0].rating }}
            </div>
            <div class="text-[10px] text-[#F1C40F]/80 mt-1 font-bold">
              {{ topThree[0].winRate }}% WR
            </div>
          </div>
          <!-- 3rd Place -->
          <div class="bg-[#0D1117] border border-[#3FB950]/40 rounded-lg p-3 text-center flex flex-col items-center justify-between order-2">
            <div class="text-[10px] text-gray-400 uppercase tracking-widest">
              RANK 03
            </div>
            <div class="w-8 h-8 rounded-full bg-[#3FB950]/20 text-[#3FB950] border border-[#3FB950] flex items-center justify-center font-bold text-sm my-1">
              🥉
            </div>
            <div class="font-bold text-white text-xs truncate max-w-full px-1">
              {{ topThree[2].username }}
            </div>
            <div class="text-[#3FB950] font-black text-base mt-1">
              {{ topThree[2].rating }}
            </div>
            <div class="text-[10px] text-gray-500 mt-1">
              {{ topThree[2].winRate }}% WR
            </div>
          </div>
        </div>
        <!-- Empty State -->
        <div
          v-if="leaderboard.length === 0"
          class="py-12 text-center font-mono-crt text-gray-500 text-sm"
        >
          NO OPERATOR COMBAT DATA REGISTERED YET
        </div>
        <!-- Leaderboard Table -->
        <div v-else class="overflow-x-auto" data-testid="leaderboard-table">
          <table class="w-full text-left font-mono-crt text-xs border-collapse">
            <thead>
              <tr class="text-gray-400 border-b border-[#30363D] text-[11px] tracking-wider uppercase">
                <th class="py-2.5 px-3">
                  RANK
                </th>
                <th class="py-2.5 px-3">
                  OPERATOR
                </th>
                <th class="py-2.5 px-3 text-right">
                  RATING
                </th>
                <th class="py-2.5 px-3 text-right">
                  PEAK
                </th>
                <th class="py-2.5 px-3 text-right">
                  WIN RATE
                </th>
                <th class="py-2.5 px-3 text-right">
                  RECORD (W/L)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in leaderboard"
                :key="entry.id"
                class="leaderboard-row border-b border-gray-800/80 transition hover:bg-gray-800/40"
                :class='{
                  "bg-[#58A6FF]/15 border-l-4 border-l-[#58A6FF] highlight-current-user":
                    currentUserId && entry.id === currentUserId,
                }'
                :data-testid="`leaderboard-row-${entry.id}`"
              >
                <!-- Rank -->
                <td class="py-3 px-3 whitespace-nowrap">
                  <span
                    class="inline-block px-2 py-0.5 rounded border text-[11px] font-bold"
                    :class="getRankBadgeClass(entry.rank)"
                  >
                    {{ getRankSymbol(entry.rank) }}
                  </span>
                </td>
                <!-- Operator name -->
                <td class="py-3 px-3 font-bold text-white whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <span>
                      {{ entry.username }}
                    </span>
                    <span
                      v-if="currentUserId && entry.id === currentUserId"
                      class="text-[9px] px-1 py-0.2 bg-[#58A6FF] text-black font-black rounded"
                    >
                      YOU
                    </span>
                  </div>
                </td>
                <!-- Rating -->
                <td class="py-3 px-3 text-right font-black text-white whitespace-nowrap text-sm">
                  <span
                    :class='entry.rank === 1
                      ? "text-[#F1C40F] crt-glow-amber"
                      : entry.rank === 2
                        ? "text-[#58A6FF]"
                        : ""'
                  >
                    {{ entry.rating }}
                  </span>
                </td>
                <!-- Peak Rating -->
                <td class="py-3 px-3 text-right text-gray-400 whitespace-nowrap">
                  {{ entry.highestRating }}
                </td>
                <!-- Win Rate -->
                <td class="py-3 px-3 text-right whitespace-nowrap">
                  <span
                    class="font-bold"
                    :class='entry.winRate >= 60
                      ? "text-[#3FB950]"
                      : entry.winRate <= 40
                        ? "text-[#E74C3C]"
                        : "text-gray-300"'
                  >
                    {{ entry.winRate }}%
                  </span>
                </td>
                <!-- Record W/L -->
                <td class="py-3 px-3 text-right text-gray-400 whitespace-nowrap">
                  <span class="text-[#3FB950] font-bold">
                    {{ entry.wins }}W
                  </span>
                  <span class="mx-1">
                    /
                  </span>
                  <span class="text-[#E74C3C] font-bold">
                    {{ entry.losses }}L
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-mono-crt {
  font-family: JetBrains Mono, monospace;
}

.crt-glow-amber {
  text-shadow: 0 0 8px #f1c40f99;
}

.crt-glow-blue {
  text-shadow: 0 0 8px #58a6ff99;
}
</style>
