import { Letter, PlayerIndex, SparseArray } from "../types";

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

type Direction = "up" | "down" | "left" | "right";

export function canReachPlayer(
  x: number,
  y: number,
  boardLetters: SparseArray<Letter>,
  owners: SparseArray<PlayerIndex>,
  boardSize: number,
  distanceRemaining: number,
  directionsRemaining: Direction[] = ["up", "down", "left", "right"]
): boolean {
  const owner = owners[y * boardSize + x];
  if (![undefined, 0].includes(owner)) {
    return true;
  }
  if (distanceRemaining === 0) {
    return false;
  }

  for (const dir of directionsRemaining) {
    const newX = x + (dir === "right" ? 1 : dir === "left" ? -1 : 0);
    const newY = y + (dir === "down" ? 1 : dir === "up" ? -1 : 0);
    if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
      // remove opposite direction from directionsRemaining
      let oppositeDirection: Direction;
      switch (dir) {
        case "up":
          oppositeDirection = "down";
          break;
        case "down":
          oppositeDirection = "up";
          break;
        case "left":
          oppositeDirection = "right";
          break;
        case "right":
          oppositeDirection = "left";
          break;
      }
      const newDirections = directionsRemaining.filter(
        (d) => d !== oppositeDirection
      );
      const removeFromDistance =
        boardLetters[y * boardSize + x] === undefined ? 1 : 0;
      if (
        canReachPlayer(
          newX,
          newY,
          boardLetters,
          owners,
          boardSize,
          distanceRemaining - removeFromDistance,
          newDirections
        )
      ) {
        return true;
      }
    }
  }
  return false;
}
