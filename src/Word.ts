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
  word: Word;
  remainingLetters: Letter[];
};

export class Word {
  private readonly letters: SparseArray<Letter>;
  private readonly boardSize: number;
  readonly isHorizontal: boolean;
  /** Index of the axis this word sits in */
  readonly axisIndex: number;
  readonly startIndex: number;
  readonly endIndex: number;
  /** The letters of this word */
  readonly word: string;

  constructor(
    letters: SparseArray<Letter>,
    boardSize: number,
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

  /**
   * Returns whether this word can be placed on the board
   * @param placedLetters out parameter - letters that are needed to place this word
   */
  isValidForPlacement(placedLetters: Array<Letter> = []) {
    if (!this.isInDictionary()) return false;

    // check if the board is free of other letters
    let s = this.mySlice();
    let needsPlacementIndices = [];
    for (let i = this.startIndex; i < this.endIndex; i++) {
      // check if the spot is free or if it is the same letter
      if (s[i] !== undefined && s[i] !== this.word[i - this.startIndex]) {
        return false;
      } else if (s[i] === undefined) {
        needsPlacementIndices.push(i);
        placedLetters.push(this.word[i - this.startIndex] as Letter);
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
      let testWord = new Word(
        simulated,
        this.boardSize,
        !this.isHorizontal, // intentionally reversed
        i, // intentionally switched from axisIndex
        this.axisIndex, // use our letter for this word's middle
        null
      );
      if (!testWord.isInDictionary()) {
        return false;
      }
    }
    return true;
  }

  getSlicesAcross() {
    let rv = [];
    let sliceFunction = this.isHorizontal ? verticalSlice : horizontalSlice;
    for (let i = this.startIndex; i < this.endIndex; i++) {
      rv.push(sliceFunction(this.letters, this.boardSize, i));
    }
    return rv;
  }

  /**
   * Returns all the words this word could be expanded into
   */
  async *getExpansionOptions(
    playerRack: Array<Letter>
  ): AsyncGenerator<ExpansionOption> {
    // no expansion is also a valid option
    yield { word: this, remainingLetters: [...playerRack] };

    let re = sliceToRegex(this.mySlice(), this.startIndex, playerRack);
    for (const word of words) {
      if (isValidMatch(word.match(re), playerRack)) {
        const wordOnlyRe = new RegExp(this.word, "g");
        for (const match of Array.from(word.matchAll(wordOnlyRe))) {
          // find start index of the word
          let startIndex = this.startIndex - match.index!;
          let wordObj = new Word(
            this.letters,
            this.boardSize,
            this.isHorizontal,
            this.axisIndex,
            this.startIndex,
            {
              word,
              startIndex: startIndex,
            }
          );
          let usedLetters: Array<Letter> = [];
          let validForPlacement = wordObj.isValidForPlacement(usedLetters);
          let rackCopy = [...playerRack];
          // see if the player actually had used letters in their rack
          for (const letter of usedLetters) {
            if (!validForPlacement) break;
            let index = rackCopy.indexOf(letter);
            if (index !== -1) {
              rackCopy.splice(index, 1);
            } else {
              validForPlacement = false;
            }
          }
          if (validForPlacement) {
            yield { word: wordObj, remainingLetters: rackCopy };
          }
        }
      }
    }
  }
}

export function findPlayerWord(gameStep: GameStep, boardSize: number) {
  let firstOwner = gameStep.owners.indexOf(0);
  let isHorizontal = gameStep.owners[firstOwner + 1] === 0;
  let axisIndex = Math.floor(firstOwner / boardSize); // y coordinate
  let middleIndex = firstOwner % boardSize; // x coordinate
  if (!isHorizontal) {
    // because these are basically the x and y coordinates of the first letter
    // if the word is vertical, we need to switch axisIndex and middleIndex
    [axisIndex, middleIndex] = [middleIndex, axisIndex];
  }
  return new Word(
    gameStep.letters,
    boardSize,
    isHorizontal,
    axisIndex,
    middleIndex,
    null
  );
}
