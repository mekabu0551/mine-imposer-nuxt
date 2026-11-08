import { ref } from "vue";

export interface RecentMatch {
  matchId: string;
  winnerId: string | null;
  isRanked: boolean;
  endReason: string;
  createdAt: string;
  userScore: number;
  opponentId: string | null;
  opponentName: string;
  opponentScore: number;
  ratingDiff: number;
  result: "win" | "lose" | "draw";
}

export interface UserState {
  id: string;
  username: string;
  rating: number;
  highest_rating?: number;
  wins: number;
  losses: number;
  winRate?: number;
  recentMatches?: RecentMatch[];
}

const generateId = () => `user_${Math.random().toString(36).substring(2, 10)}`;

// 複数個所で同じステートを共有するため、関数の外で定義する
const user = ref<UserState>({
  id: generateId(),
  username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
  rating: 1500,
  highest_rating: 1500,
  wins: 0,
  losses: 0,
  winRate: 0,
  recentMatches: [],
});

const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

export function useUser() {
  const updateUsername = (newUsername: string) => {
    if (newUsername.trim()) {
      user.value.username = newUsername.trim();
    }
  };

  const recordMatchResult = (isWin: boolean, ratingDiff: number) => {
    if (isWin) {
      user.value.wins += 1;
    } else {
      user.value.losses += 1;
    }
    user.value.rating += ratingDiff;
    if (user.value.highest_rating === undefined || user.value.rating > user.value.highest_rating) {
      user.value.highest_rating = user.value.rating;
    }
    const total = user.value.wins + user.value.losses;
    user.value.winRate = total > 0 ? Math.round((user.value.wins / total) * 100) : 0;
  };

  const fetchStats = async (apiBaseUrl?: string) => {
    const baseUrl =
      apiBaseUrl ||
      (typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:8787"
        : "");

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${baseUrl}/api/users/${user.value.id}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.user) {
        user.value.username = data.user.username;
        user.value.rating = data.user.rating;
        user.value.highest_rating = data.user.highest_rating;
        user.value.wins = data.user.wins;
        user.value.losses = data.user.losses;
        user.value.winRate = data.user.winRate;
        user.value.recentMatches = data.recentMatches || [];
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to load stats";
    } finally {
      isLoading.value = false;
    }
  };

  const resetUser = () => {
    user.value = {
      id: generateId(),
      username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
      rating: 1500,
      highest_rating: 1500,
      wins: 0,
      losses: 0,
      winRate: 0,
      recentMatches: [],
    };
    error.value = null;
  };

  return {
    user,
    isLoading,
    error,
    updateUsername,
    recordMatchResult,
    fetchStats,
    resetUser,
  };
}
