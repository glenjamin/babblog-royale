import { SparseArray } from "../types";

export function verticalSlice<T>(
  array: SparseArray<T>,
  boardSize: number,
  col: number
): SparseArray<T> {
  const slice = [];
  for (let i = 0; i < boardSize; i++) {
    slice.push(array[i * boardSize + col]);
  }
  return slice;
}

export function horizontalSlice<T>(
  array: SparseArray<T>,
  boardSize: number,
  row: number
): SparseArray<T> {
  return array.slice(row * boardSize, (row + 1) * boardSize);
}
