interface PlayerName$ extends String {
  isPlayerName: true;
}
export type PlayerName = PlayerName$ & string;

interface SocketID$ extends String {
  isSocketID: true;
}
export type SocketID = SocketID$ & string;

export type HotZone = "hot" | "warm";

export type PlayerIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export type PlayerDetails = {
  name: PlayerName;
  socketID: SocketID;
  index: PlayerIndex;
  killedStep: number | null;
};

interface KillBase {
  player: PlayerName;
  step: number;
}
interface HotZoneKill extends KillBase {
  type: "hot";
}
interface WordKill extends KillBase {
  type: "word";
  by: PlayerName;
  word: string;
}

export type Kill = HotZoneKill | WordKill;

export type Letter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

export type Item = "bomb" | "reroll_all" | "medkit" | "letter_s";

export type Bonus = Item | "2x_word" | "3x_word" | "3x_letter" | "5x_letter";

type SparseArray<T> = Array<T | void>;

export interface PlayerMetrics {
  score: number;
  kills: number;
}

export type GameStep = {
  letters: SparseArray<Letter>;
  owners: SparseArray<PlayerIndex>;
  bombedSquares: SparseArray<boolean>;
  player: {
    letters: Array<Letter>;
    rackSize: number;
    items: Array<Item>;
    itemSlots: number;
    hp: number;
    points: number;
    money: number;
    words: string[];
  };
  hot: SparseArray<HotZone>;
  metrics: Array<PlayerMetrics>;
};

export type Game = {
  id: number;
  golden: boolean;
  players: Array<PlayerDetails>;
  levels: Array<number>;
  board: {
    size: number;
    base: SparseArray<Bonus>;
  };
  timeline: Array<GameStep>;
  kills: Array<Kill>;
  winner: PlayerName | null;
  you: {
    name: PlayerName;
    MMR: number;
    oldMMR: number;
    position: number;
  };
};
