import { Letter, SparseArray } from "../types";

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

export function sliceToRegex(
  slice: SparseArray<Letter>,
  firstIndex: number,
  playerRack: Array<Letter>
) {
  let optionsGroup = `[${playerRack.join("")}]`;
  let rv = "";
  let freeAmount = 0;
  let forced = "";
  let reachedFirst = false;

  const clearForced = () => {
    if (forced.length > 0 || reachedFirst) {
      if (reachedFirst) {
        rv += `${forced})`;
        reachedFirst = false;
      } else {
        rv += `(${forced})?`;
      }
      forced = "";
    }
  };
  const clearFree = (anyway = false) => {
    if (freeAmount > 0 || rv === "" || anyway) {
      rv += `(${optionsGroup}{0,${Math.min(freeAmount, playerRack.length)}})`;
      freeAmount = 0;
    }
  };

  for (let i = 0; i < slice.length; i++) {
    const currentLetter = slice[i];
    if (i === firstIndex) {
      clearFree();
      rv += `(${forced}${currentLetter}`;
      forced = "";
      reachedFirst = true;
    } else if (currentLetter === undefined) {
      clearForced();
      freeAmount++;
    } else {
      clearFree();
      forced += currentLetter;
    }
  }
  if (reachedFirst) clearForced();
  clearFree(true);
  return new RegExp(`^${rv}$`);
}

export function isValidMatch(
  match: RegExpMatchArray | null,
  playerRack: Array<Letter>
) {
  if (match === null) {
    return false;
  }
  let playedSomething = false;
  let currentRack = [...playerRack];
  let isPlayerPlayed = false;
  for (let group of match.slice(1)) {
    isPlayerPlayed = !isPlayerPlayed;
    if (group?.length > 0 && isPlayerPlayed) {
      for (let l of group) {
        let letter = l as Letter;
        const index = currentRack.indexOf(letter);
        if (index === -1) return false;
        currentRack.splice(index, 1);
        playedSomething = true;
      }
    }
  }
  return playedSomething;
}
