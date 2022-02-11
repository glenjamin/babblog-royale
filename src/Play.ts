import { Bonus, Game, GameStep, Letter, SparseArray } from "./types";
import words from "./words.json";
import {
  horizontalSlice,
  isValidMatch,
  sliceToRegex,
  verticalSlice,
} from "./utils/gameBoardHelper";
import { tileValues } from "./constants";

type Intention = {
  word: string;
  startIndex: number;
};

export type NestedPlay = {
  thisPlay: Play;
  children: { [key: string]: NestedPlay };
  resolvableChildren: { [key: string]: () => Promise<NestedPlay> };
};

export class Play {
  // these are first so they show up first in console
  /** The letters that make up this play */
  readonly word: string;
  /** the rack after this play was performed */
  readonly isValid: boolean;
  // other properties of the play
  readonly isHorizontal: boolean;
  /** Index of the row/column this word sits in */
  readonly axisIndex: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly isInDictionary: boolean;
  readonly score: number = 0;
  readonly playerRackAfter: Letter[];
  readonly boardLettersAfter: SparseArray<Letter>;
  readonly playerKillsAfter: number;

  // properties of the game
  private readonly boardLetters: SparseArray<Letter>;
  private readonly boardSize: number;
  private readonly boardBase: SparseArray<Bonus>;
  private readonly reversePlay?: Play;

  constructor(
    boardLetters: SparseArray<Letter>,
    boardSize: number,
    boardBase: SparseArray<Bonus>,
    playerKillsBefore: number,
    playerRackBefore: Letter[],
    isHorizontal: boolean,
    axisIndex: number,
    middleIndex: number,
    calculateScore: boolean = true,
    isCurrentPlay: boolean = false,
    intended: Intention | null = null
  ) {
    playerRackBefore = [...playerRackBefore]; // can't mutate the input, could be real rack

    // these variables do not need to be calculated
    this.boardLetters = boardLetters;
    this.boardSize = boardSize;
    this.boardBase = boardBase;
    this.isHorizontal = isHorizontal;
    this.axisIndex = axisIndex;

    let letterSlice = this.mySlice();

    // region find start and end index by searching where the word starts and ends
    // find the start
    for (
      let i = intended === null ? middleIndex - 1 : intended.startIndex - 1;
      true;
      i--
    ) {
      if (letterSlice[i] === undefined) {
        // the word ended one letter before
        this.startIndex = i + 1;
        break;
      }
    }
    // find the end
    for (
      let i =
        intended === null
          ? middleIndex + 1
          : intended.startIndex + intended.word.length;
      true;
      i++
    ) {
      if (letterSlice[i] === undefined) {
        this.endIndex = i;
        break;
      }
    }
    // endregion

    // region find the word
    this.word = letterSlice.slice(this.startIndex, this.endIndex).join("");
    if (intended !== null) {
      let startIndex = this.startIndex - intended.startIndex;
      this.word =
        this.word.slice(0, startIndex) +
        intended.word +
        this.word.slice(startIndex + intended.word.length);
    }
    // endregion

    // region see if the play killed any other players
    // TODO: implement this
    let numberOfKills = 0;
    this.playerKillsAfter = playerKillsBefore + numberOfKills;
    // endregion

    // region check the validity of the play
    this.isValid = false;
    this.playerRackAfter = playerRackBefore;
    this.boardLettersAfter = [...boardLetters];

    this.isInDictionary = this.word.length === 1 || words.includes(this.word);
    if (!this.isInDictionary) {
      this.score = 0;
      return;
    }

    if (isCurrentPlay) {
      this.isValid = true; // current play is always valid
    } // don't format this line, I can't code fold
    else if (intended !== null) {
      // check if the board is free of other letters
      let needsPlacementIndices = [];
      let rackCopy = [...playerRackBefore];
      for (let i = this.startIndex; i < this.endIndex; i++) {
        // check if the spot is free or if it is the same letter
        if (
          letterSlice[i] !== undefined &&
          letterSlice[i] !== this.word[i - this.startIndex]
        ) {
          return;
        } else if (letterSlice[i] === undefined) {
          needsPlacementIndices.push(i);
          // remove the letter from rack copy
          let letterIndex = rackCopy.indexOf(
            this.word[i - this.startIndex] as Letter
          );
          if (letterIndex !== -1) {
            rackCopy.splice(letterIndex, 1);
          } else {
            return;
          }
        }
      }

      // if the word can be placed, simulate placement
      let simulated = [...this.boardLetters];
      for (let i = 0; i < needsPlacementIndices.length; i++) {
        if (this.isHorizontal) {
          simulated[
            this.boardSize * this.axisIndex + needsPlacementIndices[i]
          ] = this.word[needsPlacementIndices[i] - this.startIndex] as Letter;
        } else {
          simulated[
            this.boardSize * needsPlacementIndices[i] + this.axisIndex
          ] = this.word[needsPlacementIndices[i] - this.startIndex] as Letter;
        }
      }

      // check surrounding letters and the words they make up in the simulated board
      for (let i of needsPlacementIndices) {
        let testWord = new Play(
          simulated,
          this.boardSize,
          this.boardBase,
          0,
          rackCopy,
          !this.isHorizontal, // intentionally reversed
          i, // intentionally switched from axisIndex
          this.axisIndex,
          false
        );
        if (!testWord.isValid) {
          return;
        }
      }

      this.isValid = true;
      this.playerRackAfter = [...rackCopy];
      this.boardLettersAfter = [...simulated];
    } else {
      // We only have three types of plays
      // 1. current play
      // 2. intended play
      // 3. test play (see testWord in the else if branch just above)

      // so for the sake of that test play, we can just check if the word is in the dictionary (which is already checked)
      this.isValid = true;
    }
    // endregion

    // region calculate score
    if (calculateScore && !isCurrentPlay) {
      // based on https://discord.com/channels/880689902411452416/917600020591681616/940671620798894160
      // Every tile in your active word, multiplied by any squares you played onto like 3× letter or 2× word, all times (1 + 0.2×#kills)
      for (const letter of this.word) {
        this.score += tileValues(letter as Letter);
      }
      let baseSlice = this.mySlice(this.boardBase);
      let wordBonus = 1;
      let tilesPlayed = 0;
      for (let i = this.startIndex; i < this.endIndex; i++) {
        let boardLetter = letterSlice[i];
        if (boardLetter !== undefined) continue; // we didn't play this letter so no bonus for it
        tilesPlayed++;
        let bonus = baseSlice[i];
        if (bonus === undefined) continue; // no bonus for this letter
        if (["3x_letter", "5x_letter"].includes(bonus)) {
          let letter = this.word[i - this.startIndex] as Letter;
          let letterBonus = bonus === "3x_letter" ? 2 : 4; // we already have the letter value in there once
          this.score += tileValues(letter) * letterBonus;
        } else if (["2x_word", "3x_word"].includes(bonus)) {
          wordBonus *= bonus === "2x_word" ? 2 : 3;
        }
      }
      this.score *= wordBonus;
      this.score *= 1 + 0.2 * playerKillsBefore;

      // Plus every tile at face value for other words formed by your play
      for (const play of this.findPlaysAcross()) {
        if (play.word.length === 1) continue;
        for (const letter of play.word) {
          this.score += tileValues(letter as Letter);
        }
      }

      // Plus 50 per kill achieved by that play
      this.score += numberOfKills * 50;

      // Plus 2^(L-2) where L is the number of tiles you played, if L >= 4
      if (tilesPlayed >= 4) {
        this.score += Math.pow(2, tilesPlayed - 2);
      }

      // Plus (2L-6)^3 where L is the number of tiles you played, if L >= 4 and you emptied your rack with that play
      if (tilesPlayed >= 4 && this.playerRackAfter.length === 0) {
        this.score += Math.pow(2 * tilesPlayed - 6, 3);
      }
    }
    // endregion

    // region generate a reverse play
    if (this.word.length === 1 && !this.isHorizontal) {
      this.reversePlay = new Play(
        boardLetters,
        boardSize,
        boardBase,
        playerKillsBefore,
        playerRackBefore,
        !isHorizontal,
        middleIndex,
        axisIndex,
        false,
        true
      );
    }
    // endregion
  }

  mySlice<T>(
    getSliceOf: SparseArray<T> = this.boardLetters as SparseArray<T>
  ): SparseArray<T> {
    if (this.isHorizontal) {
      return horizontalSlice(getSliceOf, this.boardSize, this.axisIndex);
    } else {
      return verticalSlice(getSliceOf, this.boardSize, this.axisIndex);
    }
  }

  findPlaysAcross() {
    if (!this.isValid) return []; // doubt this function is ever called if the play is invalid
    let rv = [];
    for (let i = this.startIndex; i < this.endIndex; i++) {
      rv.push(
        new Play(
          this.boardLettersAfter,
          this.boardSize,
          this.boardBase,
          this.playerKillsAfter,
          this.playerRackAfter,
          !this.isHorizontal,
          i,
          this.axisIndex,
          false
        )
      );
    }
    return rv;
  }

  /**
   * Returns all the words this word could be expanded into
   */
  *getExpansionOptions(): Generator<Play> {
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
              this.boardLetters,
              this.boardSize,
              this.boardBase,
              this.playerKillsAfter,
              this.playerRackAfter,
              this.isHorizontal,
              this.axisIndex,
              this.startIndex,
              true,
              false,
              {
                word,
                startIndex: startIndex,
              }
            );
          } catch (e) {
            continue;
          }
          if (playObj.isValid) {
            yield playObj;
          }
        }
      }
    }

    if (this.reversePlay !== undefined)
      yield* this.reversePlay.getExpansionOptions();
  }
}

export function findCurrentlyPlayedWord(game: Game, gameStep: GameStep) {
  let firstOwner = gameStep.owners.indexOf(0);
  let isHorizontal = gameStep.owners[firstOwner + 1] === 0;
  let axisIndex = Math.floor(firstOwner / game.board.size); // y coordinate
  let middleIndex = firstOwner % game.board.size; // x coordinate
  if (!isHorizontal) {
    // because these are basically the x and y coordinates of the first letter
    // if the word is vertical, we need to switch axisIndex and middleIndex
    [axisIndex, middleIndex] = [middleIndex, axisIndex];
  }
  return new Play(
    gameStep.letters,
    game.board.size,
    game.board.base,
    gameStep.metrics[0].kills,
    gameStep.player.letters,
    isHorizontal,
    axisIndex,
    middleIndex
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
      let word = child.word;
      while (
        rv.children[word] !== undefined ||
        rv.resolvableChildren[word] !== undefined
      ) {
        word = word + ".";
      }

      rv.resolvableChildren[word] = () => {
        return getAllPlaysRecursively(child);
      };
    }
  }
  return rv;
}

export async function findAllPlays(game: Game, gameStep: GameStep) {
  let playerWord = findCurrentlyPlayedWord(game, gameStep);
  let startingPlays = [playerWord];
  for (const option of await walkGeneratorWhileYielding(
    playerWord.getExpansionOptions()
  )) {
    startingPlays.push(option);
    await new Promise((resolve) => setTimeout(resolve));
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

export function scoreOfPlays(plays: Play[]) {
  let rv = 0;
  for (const play of plays) {
    rv += play.score;
  }
  return rv;
}

const MAX_PLAY_TRIES = 2;

export async function findBingos(
  possiblePlays: NestedPlay,
  callback: (bingo: Play[]) => void = () => {},
  cantPlay: { [rack: string]: number } = {},
  depthRemaining = 3
): Promise<Play[]> {
  let playerRack = [...possiblePlays.thisPlay.playerRackAfter].sort().join("");
  if (cantPlay[playerRack] >= MAX_PLAY_TRIES) return [];
  if (depthRemaining === 0) return [];

  let candidates: Array<Array<Play>> = [];
  let keyLengthSort = (a: string, b: string) => {
    let wordA = a.replaceAll(".", "");
    let wordB = b.replaceAll(".", "");
    let wordAScore = 0;
    let wordBScore = 0;
    for (let i = 0; i < wordA.length; i++) {
      wordAScore += tileValues(wordA[i] as Letter);
    }
    for (let i = 0; i < wordB.length; i++) {
      wordBScore += tileValues(wordB[i] as Letter);
    }
    return wordAScore - wordBScore;
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
    let bingo = await findBingos(
      child,
      (bingo) => {
        callback([child.thisPlay, ...bingo]);
      },
      cantPlay,
      depthRemaining - 1
    );
    if (bingo.length > 0) {
      callback([child.thisPlay, ...bingo]);
      return [child.thisPlay, ...bingo];
    }
    return [];
  };
  let checkForGoodBingo = async (key: string) => {
    let bingo = await checkChildOrRecurse(key);

    // if playing one word results in bingo, we're done
    if (bingo.length === 1) {
      return { bingo: bingo, good: true };
    }

    // otherwise, try to improve the order of the bingo
    if (bingo.length > 0) {
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
          let newBingo = await checkChildOrRecurse(key);
          if (scoreOfPlays(newBingo) > scoreOfPlays(bingo)) {
            // we improved our bingo
            return { bingo: newBingo, good: true };
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
