import { GameStep, Letter, SparseArray } from "./types";
import words from "./words.json";
import {
  horizontalSlice,
  isValidMatch,
  sliceToRegex,
  verticalSlice,
} from "./utils/gameBoardHelper";

export type Intention = {
  word: string;
  startIndex: number;
};

export type ExpansionOption = {
  play: Play;
  remainingLetters: Letter[];
};

export type SimulationResult = {
  isValid: boolean;
  rackAfterPlay: Letter[] | null;
  boardAfterPlay: SparseArray<Letter> | null;
};

export type NestedPlay = {
  thisPlay: Play;
  children: { [key: string]: NestedPlay };
  resolvableChildren: { [key: string]: () => Promise<NestedPlay> };
};

export class Play {
  /** The letters of this word */
  readonly word: string; // this is first so it shows up first in console

  private readonly letters: SparseArray<Letter>;
  private readonly boardSize: number;
  /** the rack before this play.
   *  Is estimated for words that are already played
   */
  readonly playerRackBefore: Letter[];
  /** the rack after this play was performed */
  readonly playerRackAfter: Letter[];
  readonly isHorizontal: boolean;
  /** Index of the axis this word sits in */
  readonly axisIndex: number;
  readonly startIndex: number;
  readonly endIndex: number;

  constructor(
    letters: SparseArray<Letter>,
    boardSize: number,
    playerRack: Letter[], // before if intended === null, else after
    isHorizontal: boolean,
    axisIndex: number,
    middleIndex: number,
    intended: Intention | null
  ) {
    this.letters = letters;
    this.boardSize = boardSize;
    this.isHorizontal = isHorizontal;
    this.axisIndex = axisIndex;

    let s = this.mySlice();

    // find start and end index by searching where the word starts and ends
    for (
      let i = intended === null ? middleIndex - 1 : intended.startIndex - 1;
      true;
      i--
    ) {
      if (s[i] === undefined) {
        // the word ended one letter before
        this.startIndex = i + 1;
        break;
      }
    }
    for (
      let i =
        intended === null
          ? middleIndex + 1
          : intended.startIndex + intended.word.length;
      true;
      i++
    ) {
      if (s[i] === undefined) {
        this.endIndex = i;
        break;
      }
    }
    let tempSlice = s.slice(this.startIndex, this.endIndex);
    // replace undefined with placeholder character
    tempSlice = tempSlice.map((letter) =>
      letter === undefined ? "a" : letter
    );
    this.word = tempSlice.join("");

    if (intended !== null) {
      let startIndex = this.startIndex - intended.startIndex;
      this.word =
        this.word.slice(0, startIndex) +
        intended.word +
        this.word.slice(startIndex + intended.word.length);

      this.playerRackBefore = [...playerRack];
      let rackAfterPlay = this.isValidToPlay().rackAfterPlay;
      if (rackAfterPlay === null) {
        throw new Error("Invalid intention");
      } else {
        this.playerRackAfter = rackAfterPlay;
      }
    } else {
      this.playerRackAfter = playerRack;
      this.playerRackBefore = [...playerRack];
      for (const letter of this.word) {
        this.playerRackBefore.push(letter as Letter);
      }
    }
  }

  mySlice() {
    if (this.isHorizontal) {
      return horizontalSlice(this.letters, this.boardSize, this.axisIndex);
    } else {
      return verticalSlice(this.letters, this.boardSize, this.axisIndex);
    }
  }

  isInDictionary() {
    if (this.word.length === 1) return true;
    return words.includes(this.word);
  }

  lastIsValid: boolean | null = null;

  /**
   * Returns whether this word can be placed on the board
   */
  isValidToPlay(): SimulationResult {
    if (!this.isInDictionary()) {
      this.lastIsValid = false;
      return { isValid: false, rackAfterPlay: null, boardAfterPlay: null };
    }

    let rackCopy = [...this.playerRackBefore];

    // check if the board is free of other letters
    let s = this.mySlice();
    let needsPlacementIndices = [];
    for (let i = this.startIndex; i < this.endIndex; i++) {
      // check if the spot is free or if it is the same letter
      if (s[i] !== undefined && s[i] !== this.word[i - this.startIndex]) {
        this.lastIsValid = false;
        return { isValid: false, rackAfterPlay: null, boardAfterPlay: null };
      } else if (s[i] === undefined) {
        needsPlacementIndices.push(i);
        // remove the letter from rack copy
        let letterIndex = rackCopy.indexOf(
          this.word[i - this.startIndex] as Letter
        );
        if (letterIndex !== -1) {
          rackCopy.splice(letterIndex, 1);
        } else {
          this.lastIsValid = false;
          return { isValid: false, rackAfterPlay: null, boardAfterPlay: null };
        }
      }
    }

    // if the word can be placed, simulate placement
    let simulated = [...this.letters];
    for (let i = 0; i < needsPlacementIndices.length; i++) {
      if (this.isHorizontal) {
        simulated[this.boardSize * this.axisIndex + needsPlacementIndices[i]] =
          this.word[needsPlacementIndices[i] - this.startIndex] as Letter;
      } else {
        simulated[this.boardSize * needsPlacementIndices[i] + this.axisIndex] =
          this.word[needsPlacementIndices[i] - this.startIndex] as Letter;
      }
    }

    // check surrounding letters and the words they make up in the simulated board
    for (let i of needsPlacementIndices) {
      let testWord = new Play(
        simulated,
        this.boardSize,
        [...rackCopy],
        !this.isHorizontal, // intentionally reversed
        i, // intentionally switched from axisIndex
        this.axisIndex, // use our letter for this word's middle
        null
      );
      if (!testWord.isInDictionary()) {
        this.lastIsValid = false;
        return {
          isValid: false,
          rackAfterPlay: [...rackCopy],
          boardAfterPlay: null,
        };
      }
    }

    this.lastIsValid = true;
    return {
      isValid: true,
      rackAfterPlay: [...rackCopy],
      boardAfterPlay: [...simulated],
    };
  }

  getSlicesAcross() {
    let rv = [];
    let sliceFunction = this.isHorizontal ? verticalSlice : horizontalSlice;
    for (let i = this.startIndex; i < this.endIndex; i++) {
      rv.push(sliceFunction(this.letters, this.boardSize, i));
    }
    return rv;
  }

  findPlaysAcross() {
    let simulationResult = this.isValidToPlay();
    if (!simulationResult.isValid) return [];
    let rv = [];
    for (let i = this.startIndex; i < this.endIndex; i++) {
      rv.push(
        new Play(
          simulationResult.boardAfterPlay!,
          this.boardSize,
          [...this.playerRackAfter],
          !this.isHorizontal,
          i,
          this.axisIndex,
          null
        )
      );
    }
    return rv;
  }

  /**
   * Returns all the words this word could be expanded into
   */
  *getExpansionOptions(): Generator<ExpansionOption> {
    if (this.playerRackAfter.length === 0) return [];

    let re = sliceToRegex(
      this.mySlice(),
      this.startIndex,
      this.playerRackAfter
    );
    for (const word of words) {
      if (isValidMatch(word.match(re), this.playerRackAfter)) {
        const wordOnlyRe = new RegExp(this.word, "g");
        for (const match of Array.from(word.matchAll(wordOnlyRe))) {
          // find start index of the word
          let startIndex = this.startIndex - match.index!;
          let playObj: Play;
          try {
            playObj = new Play(
              this.letters,
              this.boardSize,
              [...this.playerRackAfter],
              this.isHorizontal,
              this.axisIndex,
              this.startIndex,
              {
                word,
                startIndex: startIndex,
              }
            );
          } catch (e) {
            continue;
          }
          if (playObj.lastIsValid === true) {
            yield {
              play: playObj,
              remainingLetters: playObj.playerRackAfter,
            };
          }
        }
      }
    }
  }

  getReversed(): Play {
    if (this.word.length !== 1) Error("Can only reverse single letter words");
    return new Play(
      this.letters,
      this.boardSize,
      [...this.playerRackAfter],
      !this.isHorizontal,
      this.startIndex,
      this.axisIndex,
      null
    );
  }

  isSameWordSamePosition(other: Play) {
    return (
      this.isHorizontal === other.isHorizontal &&
      this.startIndex === other.startIndex &&
      this.axisIndex === other.axisIndex &&
      this.word === other.word
    );
  }
}

export function findCurrentlyPlayedWord(gameStep: GameStep, boardSize: number) {
  let firstOwner = gameStep.owners.indexOf(0);
  let isHorizontal = gameStep.owners[firstOwner + 1] === 0;
  let axisIndex = Math.floor(firstOwner / boardSize); // y coordinate
  let middleIndex = firstOwner % boardSize; // x coordinate
  if (!isHorizontal) {
    // because these are basically the x and y coordinates of the first letter
    // if the word is vertical, we need to switch axisIndex and middleIndex
    [axisIndex, middleIndex] = [middleIndex, axisIndex];
  }
  return new Play(
    gameStep.letters,
    boardSize,
    gameStep.player.letters,
    isHorizontal,
    axisIndex,
    middleIndex,
    null
  );
}

async function walkGeneratorWhileYielding<T>(
  generator: Generator<T>
): Promise<T[]> {
  let rv = [];
  while (true) {
    let next = generator.next();
    if (next.done) break;
    rv.push(next.value);
    await new Promise((resolve) => setTimeout(resolve));
  }
  return rv;
}

export async function getAllPlaysRecursively(
  currentPlay: Play
): Promise<NestedPlay> {
  let rv: NestedPlay = {
    thisPlay: currentPlay,
    children: {},
    resolvableChildren: {},
  };

  let playsAcross = currentPlay.findPlaysAcross();
  for (const play of playsAcross) {
    for (const child of await walkGeneratorWhileYielding(
      play.getExpansionOptions()
    )) {
      let word = child.play.word;
      while (
        rv.children[word] !== undefined ||
        rv.resolvableChildren[word] !== undefined
      ) {
        word = word + ".";
      }

      rv.resolvableChildren[word] = () => {
        return getAllPlaysRecursively(child.play);
      };
    }
  }
  return rv;
}

export async function findAllPlays(gameStep: GameStep, boardSize: number) {
  let playerWord = findCurrentlyPlayedWord(gameStep, boardSize);
  let startingPlays = [playerWord];
  for (const option of await walkGeneratorWhileYielding(
    playerWord.getExpansionOptions()
  )) {
    startingPlays.push(option.play);
    await new Promise((resolve) => setTimeout(resolve));
  }
  if (playerWord.word.length === 1) {
    for (const option of await walkGeneratorWhileYielding(
      playerWord.getReversed().getExpansionOptions()
    )) {
      startingPlays.push(option.play);
      await new Promise((resolve) => setTimeout(resolve));
    }
  }

  let rv: NestedPlay = {
    thisPlay: playerWord,
    children: {},
    resolvableChildren: {},
  };

  for (const play of startingPlays) {
    let word = play.word;
    while (
      rv.children[word] !== undefined ||
      rv.resolvableChildren[word] !== undefined
    ) {
      word = word + ".";
    }
    rv.resolvableChildren[word] = () => {
      return getAllPlaysRecursively(play);
    };
  }

  return rv;
}

const MAX_PLAY_TRIES = 2;

export async function findBingos(
  possiblePlays: NestedPlay,
  callback: (bingo: Play[]) => void = () => {},
  cantPlay: { [rack: string]: number } = {}
): Promise<Play[]> {
  let playerRack = [...possiblePlays.thisPlay.playerRackAfter].sort().join("");
  if (cantPlay[playerRack] >= MAX_PLAY_TRIES) return [];

  let candidates: Array<Array<Play>> = [];
  let keyLengthSort = (a: string, b: string) => {
    let wordA = a.replaceAll(".", "");
    let wordB = b.replaceAll(".", "");
    return wordA.length - wordB.length;
  };
  let keyResolver = async (original: string[], keys: string[]) => {
    for (const key of keys) {
      possiblePlays.children[key] = await possiblePlays.resolvableChildren[
        key
      ]();
      original.push(key);
      // remove resolvable child
      delete possiblePlays.resolvableChildren[key];
    }
  };
  let checkChildOrRecurse = async (key: string) => {
    let child = possiblePlays.children[key];
    // see if the rack is empty. if so, this is a bingo
    if (child.thisPlay.playerRackAfter.length === 0) {
      callback([child.thisPlay]);
      return [child.thisPlay];
    }
    // otherwise, recurse
    let bingo = await findBingos(child, () => {}, cantPlay);
    if (bingo.length > 0) {
      callback([child.thisPlay, ...bingo]);
      return [child.thisPlay, ...bingo];
    }
    return [];
  };
  let checkForGoodBingo = async (key: string) => {
    let bingo = await checkChildOrRecurse(key);
    let bingoLength = bingo.length;

    // if playing one word results in bingo, we're done
    if (bingoLength === 1) {
      return { bingo: bingo, good: true };
    }

    // otherwise, try to improve the order of the bingo
    if (bingoLength > 0) {
      // sort the plays by their word length
      let sorted = [...bingo].sort((a, b) => a.word.length - b.word.length);

      // see if we can play shorter words right now instead of later
      // playing them early will yield more points
      for (const play of sorted) {
        let key = sortedChildren.find(
          (k) => k.replaceAll(".", "") === play.word
        );
        if (key) {
          // see if this key is a bingo
          let bingo = await checkChildOrRecurse(key);
          if (bingo.length > 0 && bingo.length < bingoLength) {
            // we improved our bingo
            return { bingo: bingo, good: true };
          }
        }
      }
      // if not, this is probably best we can do
      return { bingo: bingo, good: false };
    }
    return { bingo: [], good: false };
  };

  // find the longest keys
  let sortedChildren = [
    ...Object.keys(possiblePlays.children).sort(keyLengthSort).reverse(),
  ];
  let sortedResolvableChildren = Array.from(
    Object.keys(possiblePlays.resolvableChildren).sort(keyLengthSort).reverse()
  );

  while (sortedChildren.length > 0 || sortedResolvableChildren.length > 0) {
    // compare, which has longer words first
    let firstChild = sortedChildren[0] || "";
    let firstResolvableChild = sortedResolvableChildren[0] || "";
    if (firstChild.length > firstResolvableChild.length) {
      // we have a child that is longer than a resolvable child
      let result = await checkForGoodBingo(firstChild);
      if (result.good) {
        return result.bingo;
      } else if (result.bingo.length > 0) {
        candidates.push(result.bingo);
      }
      // we didn't find a good bingo, so remove the key
      sortedChildren.shift();
    } else {
      // we have a resolvable child that is longer than a child
      await keyResolver([], [firstResolvableChild]);
      let result = await checkForGoodBingo(firstResolvableChild);
      if (result.good) {
        return result.bingo;
      } else if (result.bingo.length > 0) {
        candidates.push(result.bingo);
      }
      sortedResolvableChildren.shift();
    }
  }

  // we didn't find any good bingos
  // return the shortest sequence that leads to a bingo
  let sorted = [...candidates].sort((a, b) => a.length - b.length);
  if (sorted.length > 0) {
    return sorted[0];
  }

  // increase the count of the rack we couldn't play
  if (cantPlay[playerRack] === undefined) {
    cantPlay[playerRack] = 1;
  } else {
    cantPlay[playerRack]++;
  }
  return [];
}