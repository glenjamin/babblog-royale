import { emptyMetrics } from "./parser";
import {
  Letter,
  PlayerName,
  Game,
  PlayerIndex,
  SocketID,
  PlayerDetails,
} from "./types";

const players: PlayerDetails[] = [
  "JohnL",
  "PaulMcC",
  "George",
  "Ringo",
  "David",
  "Freddie",
  "BrianM",
  "Roger",
  "JohnD",
  "Mick",
  "BrianJ",
  "Keith",
  "Bill",
  "Charlie",
  "Simon",
  "PaulG",
].map((name, i) => ({
  name: name as PlayerName,
  socketID: ("xx_" + name) as SocketID,
  index: i as PlayerIndex,
  killedStep: null,
  startingLetter: i % 2 === 0 ? "a" : "i",
}));

const placeholderGame: Game = {
  id: 0,
  golden: true,
  levels: [0, 10, 30, 70, 110, 160, 200, 250, 320, 380, 460, 600, 800, 1050],
  players,
  board: {
    size: 31,
    base: [],
  },
  timeline: [
    {
      letters: [],
      owners: [],
      hot: [],
      player: {
        rackSize: 5,
        letters: ["a", "i", "a", "i", "a"],
        items: ["bomb"],
        itemSlots: 1,
        hp: 100,
        words: [],
        money: 42,
        points: 801,
      },
      metrics: emptyMetrics,
      bombed: [],
    },
  ],
  kills: [],
  winner: null,
  you: {
    name: "JohnL" as PlayerName,
    MMR: 0,
    oldMMR: 0,
    position: 0,
  },
  posInFile: "nan",
};

function placeLetter(
  x: number,
  y: number,
  letter: Letter,
  owner?: PlayerIndex
) {
  const offset = x + placeholderGame.board.size * y;
  placeholderGame.timeline[0].letters[offset] = letter;
  if (owner !== undefined) {
    placeholderGame.timeline[0].owners[offset] = owner;
  }
}

function placeWord(
  x: number,
  y: number,
  word: string,
  direction: "down" | "across",
  owner?: PlayerIndex
) {
  Array.from(word).forEach((letter: any) => {
    placeLetter(x, y, letter, owner);
    direction === "down" ? y++ : x++;
  });
}

[
  "the",
  "first",
  "and",
  "original",
  "babble",
  "royale",
  "player",
  "log",
  "file",
  "viewer",
  "made",
  "by",
  "glenjamin",
  "aka",
  "glenathan",
].forEach((word, i) => {
  placeWord(1, 1 + i * 2, word, "across", i as PlayerIndex);
});

export default placeholderGame;
