export type Events = {
  Joined: {
    room: number;
    goldenRoyale: boolean;
    playerList: Array<{
      name: PlayerName;
      socketID: SocketID;
    }>;
    squaresWithMults: Array<{
      index: number;
      wordScoreMult: 2 | 3;
    }>;
    squaresWithItems: Array<{
      index: number;
      itemOnSquare: Bonus;
    }>;
  };
  SyncNewBoardState: {
    squaresWithLetters: Array<{
      letter: Letter;
      playerLivingOn: SocketID | null;
    }>;
    playerScores: Array<{
      socketID: SocketID;
      /**
       * -7347 is a magic number meaning dead
       */
      score: number;
    }>;
  };
  NewPlayerDeath: {
    playerName: PlayerName;
    playerKilledBy: PlayerName;
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

interface PlayerName$ extends String {
  isPlayerName: true;
}
export type PlayerName = PlayerName$ & string;

interface SocketID$ extends String {
  isSocketID: true;
}
export type SocketID = SocketID$ & string;

export type PlayerDetails = {
  name: PlayerName;
  socketID: SocketID;
  index: number;
};

export type Kill =
  | { type: "hot"; player: PlayerName }
  | { type: "word"; player: PlayerName; by: PlayerName; word: string };

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
  id: number;
  golden: boolean;
  players: Array<PlayerDetails>;
  board: {
    size: 32;
    base: Array<Bonus | null>;
    steps: Array<{
      letters: Array<Letter | null>;
      owners: Array<PlayerName | null>;
    }>;
  };
  kills: Array<Kill>;
  winner: PlayerName | null;
  you: {
    MMR: number;
    oldMMR: number;
    position: number;
  };
};
