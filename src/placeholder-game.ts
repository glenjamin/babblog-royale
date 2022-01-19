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
      bombedIndexes: [],
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
  const player = players[i];
  const offset = 1 + (1 + i * 2) * placeholderGame.board.size;
  Array.from(word).forEach((letter, i) => {
    placeholderGame.timeline[0].letters[offset + i] = letter as Letter;
    placeholderGame.timeline[0].owners[offset + i] = player.index;
  });
});

export default placeholderGame;
