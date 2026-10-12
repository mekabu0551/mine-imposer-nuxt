<script setup lang="ts">
import { computed } from "vue";
import type { PublicGameState, PublicCell } from "../../shared/game";

const props = defineProps<{
  gameState: PublicGameState;
}>();

const emit = defineEmits<{
  (e: "open", payload: { row: number; col: number }): void;
  (e: "flag", payload: { row: number; col: number }): void;
}>();

const player1 = computed(() => {
  return (
    props.gameState.players.find((p) => p.id === props.gameState.yourPlayerId) ||
    props.gameState.players[0]
  );
});

const player2 = computed(() => {
  return (
    props.gameState.players.find((p) => p.id !== props.gameState.yourPlayerId) ||
    props.gameState.players[1]
  );
});

const isMyTurn = computed(() => {
  return props.gameState.currentTurnPlayerId === props.gameState.yourPlayerId;
});

const flatCells = computed(() => {
  return props.gameState.board.flat();
});

const handleCellClick = (row: number, col: number) => {
  emit("open", { row, col });
};

const handleCellContextMenu = (row: number, col: number) => {
  emit("flag", { row, col });
};

const getCellClasses = (cell: PublicCell) => {
  if (cell.isOpen) {
    if (cell.isBomb) {
      return "bg-[#E74C3C]/30 border border-[#E74C3C] text-[#E74C3C]";
    }
    return "bg-[#0D1117]/80 text-gray-200 border border-[#21262D]";
  }

  // 未開封
  const base =
    "bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] hover:border-[#58A6FF]/60 cursor-pointer active:scale-95";
  if (cell.isFlagged) {
    return `${base} is-flagged bg-[#F1C40F]/10 border-[#F1C40F]/60`;
  }
  return base;
};

const getNeighborColorClass = (count: number) => {
  switch (count) {
    case 1:
      return "text-[#58A6FF]"; // 青
    case 2:
      return "text-[#3FB950]"; // 緑
    case 3:
      return "text-[#E74C3C]"; // 赤
    case 4:
      return "text-[#8957E5]"; // 紫
    case 5:
      return "text-[#F1C40F]"; // 黄
    case 6:
      return "text-[#2BA6A6]"; // シアン
    case 7:
      return "text-pink-500";
    case 8:
      return "text-gray-400";
    default:
      return "text-gray-300";
  }
};
</script>

<template>
  <div class="flex flex-col items-center justify-center p-4 max-w-4xl mx-auto crt-screen font-sans">
    <!-- 上部 HUD: プレイヤー情報・スコア・ライフ・ターン -->
    <header class="w-full bg-[#161B22] border border-[#30363D] rounded-lg p-4 mb-4 cell-inset">
      <div class="flex items-center justify-between">
        <!-- あなたの情報 (Player 1) -->
        <div class="flex flex-col items-start min-w-[140px]">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs uppercase font-mono-crt text-gray-400">
              YOU:
            </span>
            <span class="text-sm font-bold font-mono-crt text-[#58A6FF] truncate max-w-[120px]">
              {{ player1.name }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1 text-[#E74C3C]">
              <span v-for="i in 3" :key='"p1-life-" + i' class="text-sm">
                {{ i <= player1.lives ? "❤️" : "🖤" }}
              </span>
            </div>
            <span class="text-lg font-bold font-mono-crt text-[#F0F6FC]">
              {{ player1.score }}
              <span class="text-xs text-gray-500">
                PTS
              </span>
            </span>
          </div>
        </div>
        <!-- ターンインジケーター -->
        <div class="flex flex-col items-center px-4">
          <div
            class="px-4 py-1.5 rounded-full border text-xs font-mono-crt font-bold tracking-wider uppercase transition-all duration-300"
            :class='isMyTurn
              ? "bg-[#3FB950]/20 border-[#3FB950] text-[#3FB950] crt-glow"
              : "bg-gray-800/50 border-gray-600 text-gray-400"'
          >
            {{ isMyTurn ? "YOUR TURN" : "OPPONENT TURN" }}
          </div>
          <span class="text-[10px] text-gray-500 font-mono-crt mt-1 tracking-widest">
            STATUS: {{ gameState.status.toUpperCase() }}
          </span>
        </div>
        <!-- 相手の情報 (Player 2) -->
        <div class="flex flex-col items-end min-w-[140px]">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-bold font-mono-crt text-[#F1C40F] truncate max-w-[120px]">
              {{ player2.name }}
            </span>
            <span class="text-xs uppercase font-mono-crt text-gray-400">
              :RIVAL
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-lg font-bold font-mono-crt text-[#F0F6FC]">
              {{ player2.score }}
              <span class="text-xs text-gray-500">
                PTS
              </span>
            </span>
            <div class="flex items-center gap-1 text-[#E74C3C]">
              <span v-for="i in 3" :key='"p2-life-" + i' class="text-sm">
                {{ i <= player2.lives ? "❤️" : "🖤" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
    <!-- 16x16 盤面グリッド -->
    <main class="bg-[#161B22] border-2 border-[#30363D] p-3 rounded-lg shadow-2xl cell-inset select-none">
      <div class="grid grid-cols-16 gap-[2px] bg-[#0D1117] p-1 border border-[#30363D]/50 rounded">
        <button
          v-for="cell in flatCells"
          :key='"cell-" + cell.row + "-" + cell.col'
          class="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center font-mono-crt text-xs md:text-sm font-bold transition-all duration-100 rounded-[2px]"
          type="button"
          :class="getCellClasses(cell)"
          :data-testid='"cell-" + cell.row + "-" + cell.col'
          :disabled='cell.isOpen || gameState.status !== "playing"'
          @click="handleCellClick(cell.row, cell.col)"
          @contextmenu.prevent="handleCellContextMenu(cell.row, cell.col)"
        >
          <!-- 開封済み: 地雷または数字 -->
          <template v-if="cell.isOpen">
            <span v-if="cell.isBomb" class="text-[#E74C3C] text-sm md:text-base animate-pulse">
              💥
            </span>
            <span
              v-else-if="cell.neighborBombs && cell.neighborBombs > 0"
              :class="getNeighborColorClass(cell.neighborBombs)"
            >
              {{ cell.neighborBombs }}
            </span>
          </template>
          <!-- 未開封: フラグ -->
          <template v-else-if="cell.isFlagged">
            <span class="text-[#F1C40F] text-xs">
              🚩
            </span>
          </template>
        </button>
      </div>
    </main>
    <!-- 下部 操作ガイド -->
    <footer class="mt-3 text-[11px] font-mono-crt text-gray-500 tracking-wider flex items-center gap-6">
      <span>
        [L-CLICK]: OPEN MINE CELL
      </span>
      <span>
        [R-CLICK]: TOGGLE DEFUSE FLAG
      </span>
    </footer>
  </div>
</template>

<style scoped>
.grid-cols-16 {
  grid-template-columns: repeat(16, minmax(0, 1fr));
}
</style>
