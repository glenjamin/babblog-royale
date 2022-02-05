import { GameStep } from "./types";
import words from "./words.json";
import { horizontalSlice, verticalSlice } from "./utils/gameBoardHelper";

export type Intention = {
  word: string;
  startIndex: number;
};

export class Word {
  private readonly gameStep: GameStep;
  private readonly boardSize: number;
  readonly isHorizontal: boolean;
  /** Index of the axis this word sits in */
  readonly axisIndex: number;
  readonly startIndex: number;
  readonly endIndex: number;
  /** The letters of this word */
  readonly word: string;

  constructor(
    gameStep: GameStep,
    boardSize: number,
    isHorizontal: boolean,
    axisIndex: number,
    middleIndex: number,
    intended: Intention | null
  ) {
    this.gameStep = gameStep;
    this.boardSize = boardSize;
    this.isHorizontal = isHorizontal;
    this.axisIndex = axisIndex;
    this.startIndex = middleIndex;
    this.endIndex = middleIndex;

    if (intended === null) {
      // this is an already placed word
      // we need to find its start and end index

      let s = this.mySlice();

      // find start and end index by searching where the word starts and ends
      for (let i = middleIndex - 1; true; i--) {
        if (s[i] === undefined) {
          // the word ended one letter before
          this.startIndex = i + 1;
          break;
        }
      }
      for (let i = middleIndex + 1; true; i++) {
        if (s[i] === undefined) {
          this.endIndex = i;
          break;
        }
      }
      this.word = s.slice(this.startIndex, this.endIndex).join("");
    } else {
      // this is a word that is being placed
      this.word = intended.word;
      this.startIndex = intended.startIndex;
      this.endIndex = intended.startIndex + this.word.length;
    }
  }

  mySlice() {
    if (this.isHorizontal) {
      return horizontalSlice(
        this.gameStep.letters,
        this.boardSize,
        this.axisIndex
      );
    } else {
      return verticalSlice(
        this.gameStep.letters,
        this.boardSize,
        this.axisIndex
      );
    }
  }

  isInDictionary() {
    return words.includes(this.word);
  }

  isValidForPlacement() {
    if (!this.isInDictionary()) return false;

    // check if the board is free of other letters
    let s = this.mySlice();
    for (let i = this.startIndex; i < this.endIndex; i++) {
      // check if the spot is free or if it is the same letter
      if (s[i] !== undefined && s[i] !== this.word[i - this.startIndex]) {
        return false;
      }
    }

    // check surrounding letters and the words they make up
    for (let i = this.startIndex; i < this.endIndex; i++) {
      let testWord = new Word(
        this.gameStep,
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
      rv.push(sliceFunction(this.gameStep.letters, this.boardSize, i));
    }
    return rv;
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
    gameStep,
    boardSize,
    isHorizontal,
    axisIndex,
    middleIndex,
    null
  );
}
