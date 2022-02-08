import { Letter } from "./types";

export const DEAD_SCORE = -7347;

export function tileValues(tile: Letter): number {
  if (["a", "e", "i", "l", "n", "o", "r", "s", "t", "u"].includes(tile))
    return 1;
  if (["d", "g"].includes(tile)) return 2;
  if (["b", "c", "m", "p"].includes(tile)) return 3;
  if (["f", "h", "v", "w", "y"].includes(tile)) return 4;
  if (["k"].includes(tile)) return 5;
  if (["j", "x"].includes(tile)) return 8;
  if (["q", "z"].includes(tile)) return 10;
  return 0;
}
