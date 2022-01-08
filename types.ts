export type Events = {
  Joined: {
    goldenRoyale: boolean;
    playerList: Array<{
      name: string;
      socketID: string;
    }>;
  };
  SyncNewBoardState: {};
  NewPlayerDeath: {
    playerName: string;
    playerKilledBy: string;
    killedByWord: string;
  };
  EndGame: {
    winnerIndex: number;
  };
  FinalItemsAndMMR: {
    newMMR: number;
    oldMMR: number;
    placement: number;
  };
};

export type Player = string;

export type PlayerDetails = {
  name: string;
  socketID: string;
  index: number;
};

export type Kill =
  | { type: "hot"; player: Player }
  | { type: "word"; player: Player; by: Player; word: string };

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

export type Bonus =
  | "2xWord"
  | "3xWord"
  | "3xLetter"
  | "5xLetter"
  | "bomb"
  | "reroll_all"
  | "medkit"
  | "letter_s";

export type Game = {
  golden: boolean;
  players: Array<PlayerDetails>;
  board: {
    size: 32;
    base: Array<Bonus | null>;
    steps: {
      letters: Array<Letter | null>;
      owners: Array<Player | null>;
    }[];
  };
  kills: Array<Kill>;
  winner: Player | null;
  you: {
    MMR: number;
    oldMMR: number;
    position: number;
  };
};
