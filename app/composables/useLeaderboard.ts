import { ref } from "vue";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  rating: number;
  highestRating: number;
  wins: number;
  losses: number;
  winRate: number;
}

const leaderboard = ref<LeaderboardEntry[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

export function useLeaderboard() {
  const fetchLeaderboard = async (baseUrl: string = "", limit: number = 50) => {
    loading.value = true;
    error.value = null;

    try {
      const url = `${baseUrl}/api/leaderboard?limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.leaderboard)) {
        leaderboard.value = data.leaderboard;
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to load leaderboard";
    } finally {
      loading.value = false;
    }
  };

  const resetLeaderboard = () => {
    leaderboard.value = [];
    loading.value = false;
    error.value = null;
  };

  return {
    leaderboard,
    loading,
    error,
    fetchLeaderboard,
    resetLeaderboard,
  };
}
