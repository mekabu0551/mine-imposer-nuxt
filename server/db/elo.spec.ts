import { describe, expect, it } from "vitest";
import { calculateElo } from "./elo";

describe("ELO rating calculation", () => {
  it("should calculate equal point gain and loss for equally rated players on win", () => {
    const result = calculateElo({
      p1Rating: 1500,
      p2Rating: 1500,
      winner: "p1",
      kFactor: 32,
    });

    expect(result.p1Diff).toBe(16);
    expect(result.p2Diff).toBe(-16);
    expect(result.p1NewRating).toBe(1516);
    expect(result.p2NewRating).toBe(1484);
  });

  it("should calculate 0 rating change on draw between equally rated players", () => {
    const result = calculateElo({
      p1Rating: 1500,
      p2Rating: 1500,
      winner: "draw",
      kFactor: 32,
    });

    expect(result.p1Diff).toBe(0);
    expect(result.p2Diff).toBe(0);
    expect(result.p1NewRating).toBe(1500);
    expect(result.p2NewRating).toBe(1500);
  });

  it("should award fewer points when a higher-rated player wins against a lower-rated player", () => {
    const result = calculateElo({
      p1Rating: 1700,
      p2Rating: 1300,
      winner: "p1",
      kFactor: 32,
    });

    // p1 has ~91% expected win rate, so gain is small (~3 points)
    expect(result.p1Diff).toBeLessThan(10);
    expect(result.p1Diff).toBeGreaterThan(0);
    expect(result.p2Diff).toBe(-result.p1Diff);
    expect(result.p1NewRating).toBe(1700 + result.p1Diff);
    expect(result.p2NewRating).toBe(1300 - result.p1Diff);
  });

  it("should award significantly more points when an underdog wins (upset)", () => {
    const result = calculateElo({
      p1Rating: 1300,
      p2Rating: 1700,
      winner: "p1",
      kFactor: 32,
    });

    // underdog p1 has ~9% expected win rate, so gain is large (~29 points)
    expect(result.p1Diff).toBeGreaterThan(25);
    expect(result.p2Diff).toBe(-result.p1Diff);
    expect(result.p1NewRating).toBe(1300 + result.p1Diff);
    expect(result.p2NewRating).toBe(1700 - result.p1Diff);
  });

  it("should not let rating drop below 0", () => {
    const result = calculateElo({
      p1Rating: 1500,
      p2Rating: 10,
      winner: "p1",
      kFactor: 32,
    });

    expect(result.p2NewRating).toBeGreaterThanOrEqual(0);
  });
});
