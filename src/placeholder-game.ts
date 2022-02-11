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

/**
 * Game setup below here
 */
placeholderGame.timeline[0].player.letters = ["a"];
placeholderGame.timeline[0].player.items = ["medkit"];
placeholderGame.timeline[0].player.money = 2;

placeWord(0, 0, "babble", "across", 0);
placeWord(0, 2, "royale", "across");
placeWord(4, 3, "achievement", "across", 1);
placeWord(5, 4, "ho", "down");

export default placeholderGame;
