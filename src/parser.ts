import {
  Bonus,
  Game,
  Letter,
  PlayerDetails,
  PlayerIndex,
  PlayerName,
  SocketID,
} from "./types";

const HOT_ZONE = "the hot zone";

export type Events = {
  Joined: {
    room: number;
    goldenRoyale: boolean;
    gridWidth: number;
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
  EndDropPhase: {
    startingPosition: {
      x: number;
      y: number;
    };
  };
  SyncNewBoardState: {
    squaresWithLetters: Array<{
      index: number;
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
  CloseCircleChunk: {
    indexesToClose: Array<number>;
  };
  CloseCircle: {
    indexesToClose: Array<number>;
  };
};

export function newParser() {
  const games: Array<typeof game> = [];

  let game: Game;

  /**
   * Keep track of the starting position,
   * so we can figure out who the player is from the first board sync
   */
  let startIndex: number | undefined;

  /**
   * We'll keep copying this array into each timeline step
   */
  let hot: Array<"hot" | "warm"> = [];

  const handlers = {
    Joined({
      room,
      goldenRoyale,
      gridWidth,
      playerList,
      squaresWithMults,
      squaresWithItems,
    }: Events["Joined"]) {
      hot = [];
      startIndex = undefined;

      game = {
        id: room,
        golden: goldenRoyale,
        players: indexPlayers(playerList),
        board: {
          size: gridWidth,
          base: Array(gridWidth * gridWidth),
          timeline: [],
        },
        kills: [],
        winner: null,
        you: {
          name: "" as PlayerName,
          MMR: 0,
          oldMMR: 0,
          position: 0,
        },
      };

      squaresWithMults.forEach(({ index, wordScoreMult }) => {
        game.board.base[index] = wordScoreMult === 2 ? "2x_word" : "3x_word";
      });
      squaresWithItems.forEach(({ index, itemOnSquare }) => {
        game.board.base[index] = itemOnSquare;
      });

      games.push(game);
    },

    EndDropPhase({ startingPosition: { x, y } }: Events["EndDropPhase"]) {
      startIndex = game.board.size * y + x;
    },

    SyncNewBoardState({ squaresWithLetters }: Events["SyncNewBoardState"]) {
      if (startIndex && game.you.name === "") {
        identifyPlayerOne(squaresWithLetters);
      }

      const state: Game["board"]["timeline"][0] = {
        letters: [],
        owners: [],
        hot,
      };

      squaresWithLetters.forEach(({ index, letter, playerLivingOn }) => {
        state.letters[index] = letter;
        if (playerLivingOn) {
          const player = game.players.find(
            ({ socketID }) => socketID === playerLivingOn
          );
          if (player) state.owners[index] = player.index;
        }
      });

      game.board.timeline.push(state);
    },

    NewPlayerDeath({
      playerName: player,
      playerKilledBy: by,
      killedByWord,
    }: Events["NewPlayerDeath"]) {
      if (by === HOT_ZONE) {
        game.kills.push({ type: "hot", player });
      } else {
        game.kills.push({ type: "word", player, by, word: killedByWord });
      }
    },

    EndGame({ winnerIndex }: Events["EndGame"]) {
      game.winner = game.players[winnerIndex].name;
    },

    FinalItemsAndMMR({
      newMMR,
      oldMMR,
      placement,
    }: Events["FinalItemsAndMMR"]) {
      game.you = {
        name: game.you.name,
        MMR: newMMR,
        oldMMR,
        position: placement,
      };
    },

    CloseCircleChunk({ indexesToClose }: Events["CloseCircleChunk"]) {
      hot = hot.slice();
      indexesToClose.forEach((i) => {
        hot[i] = "hot";
      });
    },

    CloseCircle({ indexesToClose }: Events["CloseCircle"]) {
      hot = hot.slice();
      indexesToClose.forEach((i) => {
        if (!hot[i]) hot[i] = "warm";
      });
    },
  };

  function identifyPlayerOne(
    squares: Events["SyncNewBoardState"]["squaresWithLetters"]
  ) {
    const square = squares.find(({ index }) => index === startIndex);
    if (!square?.playerLivingOn) {
      game.you.name = "unknown" as PlayerName;
      return;
    }

    const newPlayers: PlayerDetails[] = [];
    game.players.forEach((player) => {
      if (player.socketID === square.playerLivingOn) {
        newPlayers.unshift(player);
      } else {
        newPlayers.push(player);
      }
    });
    game.players = indexPlayers(newPlayers);
    game.you.name = game.players[0].name;
  }

  let buffer = "";
  function handleLine(line: string) {
    if (line[0] !== "[" || line[1] !== '"') return;
    const [event, payload]: [keyof Events, any] = JSON.parse(line);
    const handler = handlers[event];
    if (handler) handler(payload);
  }

  return {
    parse(chunk: string) {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        handleLine(line);
      }
    },
    end() {
      handleLine(buffer);
    },
    games() {
      return games;
    },
  };
}

function indexPlayers(players: Omit<PlayerDetails, "index">[]) {
  return players.map(({ name, socketID }, index) => ({
    socketID,
    name,
    index: playerIndex(index),
  }));
}

function playerIndex(i: number): PlayerIndex {
  if (i < 0 || i > 15) {
    throw new Error("invalid player index");
  }
  return i as any;
}
