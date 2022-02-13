import { Bonus, Game, Letter, PlayerIndex, SparseArray } from "./types";
import words from "./words.json";
import {
  canReachPlayer,
  horizontalSlice,
  isValidMatch,
  sliceToRegex,
  verticalSlice,
} from "./utils/gameBoardHelper";
import { tileValues } from "./constants";

async function waitEventLoop() {
  return new Promise((resolve) => setTimeout(resolve));
}

type Intention = {
  word: string;
  startIndex: number;
};

export function playsScore(plays: Play[]): number {
  return Math.floor(plays.reduce((score, play) => score + play.score, 0));
}

export class Play {
  // these are first so they show up first in console
  /** The letters that make up this play */
  readonly word: string;
  /** the rack after this play was performed */
  readonly playerRackAfter: Letter[];
  readonly isValid: boolean;
  // other properties of the play
  readonly isHorizontal: boolean;
  /** Index of the row/column this word sits in */
  readonly axisIndex: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly isInDictionary: boolean;
  /** Amount of players this play killed */
  readonly killedCount: number;
  readonly score: number = 0;
  readonly boardLettersAfter: SparseArray<Letter>;
  readonly playerKillsAfter: number;
  readonly knownChildren: Play[] = [];
  private readonly isCurrentPlay: boolean;
  private readonly reversePlay?: Play;

  // properties of the game
  private readonly boardLetters: SparseArray<Letter>;
  private readonly boardSize: number;
  private readonly boardBase: SparseArray<Bonus>;
  private readonly owners: SparseArray<PlayerIndex>;

  constructor(
    boardLetters: SparseArray<Letter>,
    boardSize: number,
    boardBase: SparseArray<Bonus>,
    owners: SparseArray<PlayerIndex>,
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
    this.owners = owners;
    this.isCurrentPlay = isCurrentPlay;
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
    let killedPlayerIndices: Set<PlayerIndex> = new Set();
    for (let i = this.startIndex; i < this.endIndex; i++) {
      // get coords of the letter
      let x, y;
      if (this.isHorizontal) {
        x = i;
        y = this.axisIndex;
      } else {
        x = this.axisIndex;
        y = i;
      }
      let index = x + y * this.boardSize;
      // see if directly neighbouring it is a player
      // in x direction
      for (let d of [-1, 0, 1]) {
        if (![undefined, 0].includes(owners[index + d])) {
          killedPlayerIndices.add(owners[index + d]!);
        }
      }
      // same in y direction
      for (let d of [-this.boardSize, 0, this.boardSize]) {
        if (![undefined, 0].includes(owners[index + d])) {
          killedPlayerIndices.add(owners[index + d]!);
        }
      }
    }

    this.killedCount = killedPlayerIndices.size;
    this.playerKillsAfter = playerKillsBefore + this.killedCount;

    // remove killed players from the board
    this.owners = [...owners].map((owner) => {
      if (owner === undefined || killedPlayerIndices.has(owner)) {
        return undefined;
      } else {
        return owner;
      }
    });
    // endregion

    let playedIndices = []; // calculated while checking validity, used to calculate score

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
      let rackCopy = [...playerRackBefore];
      for (let i = this.startIndex; i < this.endIndex; i++) {
        // check if the spot is free or if it is the same letter
        if (
          letterSlice[i] !== undefined &&
          letterSlice[i] !== this.word[i - this.startIndex]
        ) {
          return;
        } else if (letterSlice[i] === undefined) {
          playedIndices.push(i);
          // remove the letter from rack copy
          let letter = this.word[i - this.startIndex] as Letter;
          let letterIndex = rackCopy.indexOf(letter);
          if (letterIndex !== -1) {
            rackCopy.splice(letterIndex, 1);
          } else {
            return;
          }
        }
      }

      // if the word can be placed, simulate placement
      let simulated = [...this.boardLetters];
      for (let i = 0; i < playedIndices.length; i++) {
        if (this.isHorizontal) {
          simulated[this.boardSize * this.axisIndex + playedIndices[i]] = this
            .word[playedIndices[i] - this.startIndex] as Letter;
        } else {
          simulated[this.boardSize * playedIndices[i] + this.axisIndex] = this
            .word[playedIndices[i] - this.startIndex] as Letter;
        }
      }

      // check surrounding letters and the words they make up in the simulated board
      for (let i of playedIndices) {
        let testWord = new Play(
          simulated,
          this.boardSize,
          this.boardBase,
          this.owners,
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
        if (!playedIndices.includes(play.axisIndex)) continue;
        for (const letter of play.word) {
          this.score += tileValues(letter as Letter);
        }
      }

      // Plus 50 per kill achieved by that play
      this.score += this.killedCount * 50;

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
        owners,
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
    if (this.isCurrentPlay) return [this];
    let rv = [];
    for (let i = this.startIndex; i < this.endIndex; i++) {
      rv.push(
        new Play(
          this.boardLettersAfter,
          this.boardSize,
          this.boardBase,
          this.owners,
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
    if (this.isCurrentPlay) yield this;

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
          if (startIndex < 0) continue;
          let playObj: Play;
          try {
            playObj = new Play(
              this.boardLetters,
              this.boardSize,
              this.boardBase,
              this.owners,
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

  async *findChildren() {
    // first yield already known children
    for (const child of this.knownChildren) {
      await waitEventLoop();
      yield Promise.resolve(child);
    }

    // then find new children
    for (const across of this.findPlaysAcross()) {
      const generator = across.getExpansionOptions();
      while (true) {
        await waitEventLoop();
        const child = generator.next();
        if (child.done) break;
        yield Promise.resolve(child.value);
        this.knownChildren.push(child.value);
      }
    }
  }

  async *findRackClears(
    numberOfWordsSearched: number[] = [0],
    callback: () => void = () => {},
    maxNumberOfWords: number = 2000,
    tryRacksUntil: number = 3,
    depthRemaining = 3,
    cantPlayRacks: { [rack: string]: number } = {}
  ): AsyncGenerator<Play[]> {
    numberOfWordsSearched[0]++;
    callback();

    if (this.playerRackAfter.length === 0) {
      yield Promise.resolve([this]);
      return;
    }

    if (numberOfWordsSearched[0] > maxNumberOfWords) return;
    const playerRack = [...this.playerRackAfter].sort().join("");
    if (cantPlayRacks[playerRack] >= tryRacksUntil) return;
    if (depthRemaining === 0) return;
    let resultedInClear = false;

    // breadth first search
    for (let i = 1; i <= depthRemaining; i++) {
      if (resultedInClear) break; // found a clear at previous depth, no need to search deeper
      const childrenGenerator = this.findChildren();
      while (true) {
        await waitEventLoop();
        const child = await childrenGenerator.next();
        if (child.done) break;
        const childBingoGenerator = child.value.findRackClears(
          numberOfWordsSearched,
          callback,
          maxNumberOfWords,
          tryRacksUntil,
          i - 1,
          cantPlayRacks
        );
        while (true) {
          await waitEventLoop();
          const clear = await childBingoGenerator.next();
          if (clear.done) break;
          yield Promise.resolve([this, ...clear.value]);
          resultedInClear = true;
        }
      }
    }

    if (!resultedInClear) {
      cantPlayRacks[playerRack] = cantPlayRacks[playerRack]++ || 1;
    }
  }

  checkIfCanKill() {
    const x = this.isHorizontal ? this.startIndex : this.axisIndex;
    const y = this.isHorizontal ? this.axisIndex : this.startIndex;
    return canReachPlayer(
      x,
      y,
      this.boardLetters,
      this.owners,
      this.boardSize,
      this.playerRackAfter.length
    );
  }

  async *findKills(
    numberOfWordsSearched: number[] = [0],
    callback: () => void = () => {},
    maxNumberOfWords: number = 2000,
    tryRacksUntil: number = 3,
    depthRemaining = 3,
    cantPlayRacks: { [rack: string]: number } = {}
  ): AsyncGenerator<Play[]> {
    numberOfWordsSearched[0]++;
    callback();

    if (!this.checkIfCanKill()) {
      if (this.killedCount > 0) {
        yield Promise.resolve([this]);
      } else {
        return;
      }
    }

    if (numberOfWordsSearched[0] > maxNumberOfWords) return;
    const playerRack = [...this.playerRackAfter].sort().join("");
    if (cantPlayRacks[playerRack] >= tryRacksUntil) return;
    if (depthRemaining === 0) return;
    let resultedInKill = false; /* this might be unnecessary for kill finding ()
    might cause us to miss multi-kills *shrug*/

    // breadth first search
    for (let i = 1; i <= depthRemaining; i++) {
      if (resultedInKill) break; // found a kill at previous depth, no need to search deeper
      const childrenGenerator = this.findChildren();
      while (true) {
        await waitEventLoop();
        const child = await childrenGenerator.next();
        if (child.done) break;
        const childKillGenerator = child.value.findKills(
          numberOfWordsSearched,
          callback,
          maxNumberOfWords,
          tryRacksUntil,
          i - 1,
          cantPlayRacks
        );
        while (true) {
          await waitEventLoop();
          const kill = await childKillGenerator.next();
          if (kill.done) break;
          yield Promise.resolve([this, ...kill.value]);
          resultedInKill = true;
        }
      }
    }

    if (!resultedInKill) {
      cantPlayRacks[playerRack] = cantPlayRacks[playerRack]++ || 1;
      if (this.killedCount > 0) {
        yield Promise.resolve([this]);
      }
    }
  }
}

export function findCurrentlyPlayedWord(
  game: Game,
  currentStep: number,
  ownerToFind: PlayerIndex = 0
): Play {
  let gameStep = game.timeline[currentStep];
  let firstOwner = gameStep.owners.indexOf(ownerToFind);
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
    gameStep.owners,
    gameStep.metrics[0].kills,
    gameStep.player.letters,
    isHorizontal,
    axisIndex,
    middleIndex,
    false,
    true
  );
}
