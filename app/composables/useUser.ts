import { ref } from "vue";

interface UserState {
  username: string;
  rating: number;
  wins: number;
  losses: number;
}

// 複数個所で同じステートを共有するため、関数の外で定義する
const user = ref<UserState>({
  username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
  rating: 1500,
  wins: 0,
  losses: 0,
});

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
  };

  const resetUser = () => {
    user.value = {
      username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
      rating: 1500,
      wins: 0,
      losses: 0,
    };
  };

  return {
    user,
    updateUsername,
    recordMatchResult,
    resetUser,
  };
}
