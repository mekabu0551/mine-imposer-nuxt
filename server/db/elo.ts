export interface EloParams {
  p1Rating: number;
  p2Rating: number;
  winner: "p1" | "p2" | "draw";
  kFactor?: number;
}

export interface EloResult {
  p1Diff: number;
  p2Diff: number;
  p1NewRating: number;
  p2NewRating: number;
}

/**
 * Calculates ELO rating changes for two players.
 * Standard ELO formula:
 * E_A = 1 / (1 + 10 ^ ((R_B - R_A) / 400))
 * E_B = 1 / (1 + 10 ^ ((R_A - R_B) / 400))
 * Delta = round(K * (S - E))
 */
export function calculateElo({ p1Rating, p2Rating, winner, kFactor = 32 }: EloParams): EloResult {
  const expectedP1 = 1 / (1 + Math.pow(10, (p2Rating - p1Rating) / 400));
  const expectedP2 = 1 - expectedP1;

  let actualP1: number;
  let actualP2: number;

  if (winner === "p1") {
    actualP1 = 1;
    actualP2 = 0;
  } else if (winner === "p2") {
    actualP1 = 0;
    actualP2 = 1;
  } else {
    actualP1 = 0.5;
    actualP2 = 0.5;
  }

  const p1Diff = Math.round(kFactor * (actualP1 - expectedP1)) || 0;
  // Zero-sum exchange ensures symmetrical rating changes
  const p2Diff = p1Diff === 0 ? 0 : -p1Diff;

  const p1NewRating = Math.max(0, p1Rating + p1Diff);
  const p2NewRating = Math.max(0, p2Rating + p2Diff);

  return {
    p1Diff,
    p2Diff,
    p1NewRating,
    p2NewRating,
  };
}
