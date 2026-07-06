<template>
  <div class="min-h-screen flex flex-col justify-between p-6 bg-[#0D1117] crt-screen select-none text-[#F0F6FC] font-sans">
    
    <!-- ヘッダー / タイトル -->
    <header class="text-center py-6 border-b border-[#30363D]">
      <h1 class="text-3xl md:text-5xl font-extrabold tracking-wider text-[#58A6FF] crt-glow uppercase mb-2">
        Mine Imposer
      </h1>
      <p class="text-xs md:text-sm font-mono-crt text-[#F1C40F] tracking-widest uppercase">
        [ SYSTEM OPERATIONAL - BOMB DISPOSAL TERMINAL ]
      </p>
    </header>

    <!-- メインコンテンツ -->
    <main class="flex-grow flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-5xl mx-auto w-full my-8">
      
      <!-- 左パネル: ユーザープロフィール -->
      <section class="flex-1 bg-[#161B22] border border-[#30363D] rounded-lg p-6 flex flex-col justify-between cell-inset">
        <div>
          <div class="flex items-center gap-3 border-b border-[#30363D] pb-4 mb-6">
            <UserIcon class="w-6 h-6 text-[#58A6FF] crt-glow" />
            <h2 class="text-lg font-mono-crt uppercase text-[#58A6FF] tracking-wider">Operator Profile</h2>
          </div>

          <!-- ユーザー名表示/編集 -->
          <div class="mb-8">
            <label class="block text-xs font-mono-crt text-gray-500 uppercase tracking-widest mb-2">Identifier</label>
            <div class="flex items-center gap-3">
              <div v-if="!isEditing" class="flex items-center gap-3 w-full">
                <span class="text-2xl font-mono-crt font-bold text-[#F0F6FC] tracking-wide truncate">
                  {{ user.username }}
                </span>
                <button
                  data-testid="edit-username-btn"
                  @click="startEdit"
                  class="p-2 bg-[#0D1117] hover:bg-[#30363D] border border-[#30363D] rounded transition duration-200 text-gray-400 hover:text-[#58A6FF]"
                  title="Edit Identifier"
                >
                  <Edit3Icon class="w-4 h-4" />
                </button>
              </div>
              <div v-else class="flex items-center gap-2 w-full">
                <input
                  v-model="editName"
                  @keyup.enter="saveEdit"
                  @keyup.esc="cancelEdit"
                  class="flex-grow bg-[#0D1117] border-2 border-[#58A6FF] rounded px-3 py-1 text-xl font-mono-crt text-[#F0F6FC] focus:outline-none focus:ring-1 focus:ring-[#58A6FF] crt-glow"
                  ref="usernameInput"
                  maxlength="20"
                />
                <button
                  data-testid="save-username-btn"
                  @click="saveEdit"
                  class="p-2 bg-[#3FB950]/20 hover:bg-[#3FB950]/40 border border-[#3FB950] rounded transition duration-200 text-[#3FB950]"
                  title="Save"
                >
                  <SaveIcon class="w-4 h-4" />
                </button>
                <button
                  @click="cancelEdit"
                  class="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded transition duration-200 text-gray-400"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- スタッツ情報 -->
          <div class="grid grid-cols-2 gap-4">
            <!-- レート ELO -->
            <div class="bg-[#0D1117] border border-[#30363D] rounded p-4 flex flex-col items-center justify-center">
              <TrophyIcon class="w-8 h-8 text-[#F1C40F] crt-glow-amber mb-2" />
              <span class="text-xs font-mono-crt text-gray-500 uppercase tracking-widest">ELO Rating</span>
              <span class="text-2xl font-mono-crt font-bold text-[#F0F6FC] mt-1">{{ user.rating }}</span>
            </div>

            <!-- 勝敗数 -->
            <div class="bg-[#0D1117] border border-[#30363D] rounded p-4 flex flex-col items-center justify-center">
              <SwordsIcon class="w-8 h-8 text-[#E74C3C] crt-glow-red mb-2" />
              <span class="text-xs font-mono-crt text-gray-500 uppercase tracking-widest">Record</span>
              <span class="text-xl font-mono-crt font-bold mt-1">
                <span class="text-[#3FB950]">{{ user.wins }}W</span>
                <span class="text-gray-600 mx-1">/</span>
                <span class="text-[#E74C3C]">{{ user.losses }}L</span>
              </span>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-4 border-t border-[#30363D] text-[10px] font-mono-crt text-gray-500 tracking-wider">
          SECURE CONNECTION ESTABLISHED. ALL TRANSACTIONS ENCRYPTED.
        </div>
      </section>

      <!-- 右パネル: 対戦モード選択 -->
      <section class="flex-1 bg-[#161B22] border border-[#30363D] rounded-lg p-6 flex flex-col justify-between cell-inset">
        <div>
          <div class="flex items-center gap-3 border-b border-[#30363D] pb-4 mb-6">
            <ShieldAlertIcon class="w-6 h-6 text-[#F1C40F] crt-glow-amber" />
            <h2 class="text-lg font-mono-crt uppercase text-[#F1C40F] tracking-wider">Engagement Protocol</h2>
          </div>
          
          <p class="text-xs md:text-sm text-gray-400 font-sans leading-relaxed mb-6">
            対戦相手と共有の16x16爆発物フィールドへアクセスします。
            安全にマスを開放してスコアを稼ぐか、相手を誘い込んでノックアウトさせる必要があります。制限時間は1ターン10秒です。
          </p>

          <!-- モード選択ボタン -->
          <div class="flex flex-col gap-4">
            <!-- ランダムマッチ -->
            <button
              data-testid="random-match-btn"
              @click="$emit('select-mode', 'random')"
              class="w-full flex items-center justify-between p-4 bg-[#0D1117] hover:bg-[#30363D] border border-[#30363D] hover:border-[#58A6FF] rounded-lg transition duration-300 group text-left cell-outset hover:crt-glow"
            >
              <div class="flex items-center gap-4">
                <div class="p-3 bg-[#58A6FF]/10 group-hover:bg-[#58A6FF]/20 rounded border border-[#58A6FF]/30 transition duration-300">
                  <SwordsIcon class="w-6 h-6 text-[#58A6FF]" />
                </div>
                <div>
                  <h3 class="text-lg font-bold font-mono-crt text-[#58A6FF] uppercase">Random Match</h3>
                  <p class="text-xs text-gray-500 font-sans mt-0.5">オンラインの対戦相手と対戦を行います（レート対象）</p>
                </div>
              </div>
              <span class="text-[#58A6FF] opacity-0 group-hover:opacity-100 transition duration-300 mr-2">▶</span>
            </button>

            <!-- 合言葉マッチ -->
            <button
              data-testid="private-match-btn"
              @click="$emit('select-mode', 'private')"
              class="w-full flex items-center justify-between p-4 bg-[#0D1117] hover:bg-[#30363D] border border-[#30363D] hover:border-[#F1C40F] rounded-lg transition duration-300 group text-left cell-outset hover:crt-glow-amber"
            >
              <div class="flex items-center gap-4">
                <div class="p-3 bg-[#F1C40F]/10 group-hover:bg-[#F1C40F]/20 rounded border border-[#F1C40F]/30 transition duration-300">
                  <LockIcon class="w-6 h-6 text-[#F1C40F]" />
                </div>
                <div>
                  <h3 class="text-lg font-bold font-mono-crt text-[#F1C40F] uppercase">Private Match</h3>
                  <p class="text-xs text-gray-500 font-sans mt-0.5">合言葉を指定して特定のプレイヤーと対戦します</p>
                </div>
              </div>
              <span class="text-[#F1C40F] opacity-0 group-hover:opacity-100 transition duration-300 mr-2">▶</span>
            </button>
          </div>
        </div>

        <div class="mt-8 pt-4 border-t border-[#30363D] text-[10px] font-mono-crt text-gray-500 tracking-wider">
          SYSTEM CLASSIFICATION: CLASS 3 TACTICAL TERMINAL.
        </div>
      </section>
    </main>

    <!-- フッター -->
    <footer class="text-center py-4 border-t border-[#30363D] text-xs font-mono-crt text-gray-600 tracking-wide">
      &copy; 2026 MINE IMPOSER INTERACTIVE SYSTEM. ALL RIGHTS RESERVED.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { useUser } from "../composables/useUser";
import {
  User as UserIcon,
  Edit3 as Edit3Icon,
  Save as SaveIcon,
  Trophy as TrophyIcon,
  Swords as SwordsIcon,
  ShieldAlert as ShieldAlertIcon,
  Lock as LockIcon,
} from "@lucide/vue";

defineEmits<{
  (e: "select-mode", mode: "random" | "private"): void;
}>();

const { user, updateUsername } = useUser();

const isEditing = ref(false);
const editName = ref("");
const usernameInput = ref<HTMLInputElement | null>(null);

const startEdit = async () => {
  editName.value = user.value.username;
  isEditing.value = true;
  await nextTick();
  usernameInput.value?.focus();
};

const saveEdit = () => {
  const cleanName = editName.value.trim();
  if (cleanName) {
    updateUsername(cleanName);
    isEditing.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
};
</script>
