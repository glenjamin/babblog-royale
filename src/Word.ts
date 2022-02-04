import { GameStep, Letter, SparseArray } from "./types";
import words from "./words.json";
import { horizontalSlice, verticalSlice } from "./utils/gameBoardHelper";

export type Intention = {
  word: string;
  startIndex: number;
};

export class Word {
  private readonly gameStep: GameStep;
  private readonly boardSize: number;
  private readonly isHorizontal: boolean;
  private readonly axisIndex: number;
  private readonly startIndex: number;
  private readonly endIndex: number;
  private readonly word: string;

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
      let s: SparseArray<Letter>;

      if (isHorizontal) {
        s = horizontalSlice(this.gameStep.letters, boardSize, axisIndex);
      } else {
        s = verticalSlice(this.gameStep.letters, boardSize, axisIndex);
      }

      for (let i = middleIndex - 1; true; i--) {
        if (s[i] === undefined) {
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
      this.word = intended.word;
      this.startIndex = intended.startIndex;
      this.endIndex = intended.startIndex + this.word.length;
    }
  }

  isValid() {
    return words.includes(this.word);
  }

  isValidForPlacement() {
    for (let i = this.startIndex; i < this.endIndex; i++) {
      let testWord = new Word(
        this.gameStep,
        this.boardSize,
        !this.isHorizontal, // intentionally reversed
        i, // intentionally switched from axisIndex
        this.axisIndex, // use our letter for this word's middle
        null
      );
      if (!testWord.isValid()) {
        return false;
      }
    }
    return true;
  }
}

export function findPlayerWord(gameStep: GameStep, boardSize: number) {
  let firstOwner = gameStep.owners.indexOf(0);
  let isHorizontal = gameStep.owners[firstOwner + 1] === 0;
  let axisIndex = Math.floor(firstOwner / boardSize);
  let middleIndex = firstOwner % boardSize;
  if (!isHorizontal) {
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
