<script setup lang="ts">
import { computed } from "vue";
import type { UserState } from "../composables/useUser";

const props = defineProps<{
  user: UserState;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const winRateDisplay = computed(() => {
  if (props.user.winRate !== undefined) {
    return `${props.user.winRate}%`;
  }
  const total = props.user.wins + props.user.losses;
  if (total === 0) return "0%";
  return `${Math.round((props.user.wins / total) * 100)}%`;
});

const totalMatches = computed(() => props.user.wins + props.user.losses);
const peakRating = computed(() => props.user.highest_rating ?? props.user.rating);

const recentMatches = computed(() => props.user.recentMatches || []);

const formatRatingDiff = (diff: number) => {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return "±0";
};

const getResultBadgeClass = (result: string) => {
  if (result === "win") return "bg-[#3FB950]/20 text-[#3FB950] border-[#3FB950]/40";
  if (result === "draw") return "bg-[#F1C40F]/20 text-[#F1C40F] border-[#F1C40F]/40";
  return "bg-[#E74C3C]/20 text-[#E74C3C] border-[#E74C3C]/40";
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    data-testid="profile-modal-backdrop"
    @click.self='emit("close")'
  >
    <div class="w-full max-w-2xl bg-[#161B22] border-2 border-[#30363D] rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-sans crt-screen max-h-[90vh] flex flex-col">
      <!-- Top Terminal Header -->
      <div class="flex items-center justify-between border-b border-[#30363D] pb-3 mb-6 font-mono-crt text-xs text-gray-400">
        <span class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-[#58A6FF] animate-pulse"></span>
          OPERATOR DOSSIER // SERVICE RECORD
        </span>
        <button
          class="text-gray-400 hover:text-white px-2 py-1 bg-gray-800/80 rounded border border-gray-600 transition"
          data-testid="close-profile-btn"
          type="button"
          @click='emit("close")'
        >
          ✕ CLOSE
        </button>
      </div>
      <div class="overflow-y-auto pr-1 flex-1">
        <!-- User Profile Summary Section -->
        <div class="bg-[#0D1117] border border-[#30363D] rounded-lg p-5 mb-6 font-mono-crt">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="text-xs text-[#58A6FF] tracking-wider mb-1">
                CALLSIGN / IDENTITY
              </div>
              <h2 class="text-2xl font-black text-white tracking-wide">
                {{ user.username }}
              </h2>
              <div class="text-xs text-gray-500 mt-1">
                ID: {{ user.id }}
              </div>
            </div>
            <!-- Rating badges -->
            <div class="flex items-center gap-4">
              <div class="text-right">
                <span class="text-[10px] text-gray-400 block">
                  CURRENT RATING
                </span>
                <span class="text-2xl font-black text-[#58A6FF] crt-glow-blue">
                  {{ user.rating }}
                </span>
              </div>
              <div class="h-8 w-px bg-gray-700"></div>
              <div class="text-right">
                <span class="text-[10px] text-gray-400 block">
                  PEAK RATING
                </span>
                <span class="text-xl font-bold text-[#F1C40F] crt-glow-amber">
                  {{ peakRating }}
                </span>
              </div>
            </div>
          </div>
          <!-- Combat Statistics Grid -->
          <div class="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-gray-800 text-center">
            <div class="p-2 rounded bg-black/30">
              <span class="text-[10px] text-gray-500 block">
                BATTLES
              </span>
              <span class="text-lg font-bold text-gray-200">
                {{ totalMatches }}
              </span>
            </div>
            <div class="p-2 rounded bg-black/30">
              <span class="text-[10px] text-gray-500 block">
                WINS
              </span>
              <span class="text-lg font-bold text-[#3FB950]">
                {{ user.wins }}
              </span>
            </div>
            <div class="p-2 rounded bg-black/30">
              <span class="text-[10px] text-gray-500 block">
                LOSSES
              </span>
              <span class="text-lg font-bold text-[#E74C3C]">
                {{ user.losses }}
              </span>
            </div>
            <div class="p-2 rounded bg-black/30">
              <span class="text-[10px] text-gray-500 block">
                WIN RATE
              </span>
              <span class="text-lg font-bold text-[#58A6FF]">
                {{ winRateDisplay }}
              </span>
            </div>
          </div>
        </div>
        <!-- Recent Matches History Section -->
        <div>
          <div class="flex items-center justify-between mb-3 font-mono-crt">
            <span class="text-xs font-bold text-gray-300 tracking-wider flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#58A6FF]"></span>
              RECENT COMBAT ENGAGEMENTS (LAST 10)
            </span>
            <span class="text-xs text-gray-500">
              {{ recentMatches.length }} RECORDED
            </span>
          </div>
          <div
            v-if="recentMatches.length === 0"
            class="text-center py-8 border border-dashed border-gray-700 rounded-lg text-gray-500 font-mono-crt text-xs"
          >
            NO RECENT ENGAGEMENTS RECORDED IN CLOUD LOGS.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="match in recentMatches"
              :key="match.matchId"
              class="bg-black/30 border border-[#30363D] hover:border-gray-600 rounded-lg p-3 flex items-center justify-between font-mono-crt transition"
              data-testid="match-history-item"
            >
              <!-- Left: Result Badge + Opponent Name -->
              <div class="flex items-center gap-3">
                <span
                  class="text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider"
                  :class="getResultBadgeClass(match.result)"
                >
                  {{ match.result.toUpperCase() }}
                </span>
                <div>
                  <div class="text-sm font-bold text-gray-200">
                    vs {{ match.opponentName }}
                  </div>
                  <div class="text-[10px] text-gray-500">
                    {{ match.createdAt }} • {{ match.endReason.toUpperCase() }}
                  </div>
                </div>
              </div>
              <!-- Right: Score + Rating diff -->
              <div class="flex items-center gap-4 text-right">
                <div class="text-xs text-gray-300">
                  <span class="font-bold text-[#58A6FF]">
                    {{ match.userScore }}
                  </span>
                  <span class="text-gray-500 mx-1">
                    -
                  </span>
                  <span class="text-gray-400">
                    {{ match.opponentScore }}
                  </span>
                </div>
                <div class="w-14 text-right">
                  <span
                    class="text-xs font-bold"
                    :class='match.ratingDiff > 0
                      ? "text-[#3FB950]"
                      : match.ratingDiff < 0
                        ? "text-[#E74C3C]"
                        : "text-gray-400"'
                  >
                    {{ formatRatingDiff(match.ratingDiff) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
