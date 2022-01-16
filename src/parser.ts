import {
  Bonus,
  Game,
  GameStep,
  Item,
  Letter,
  PlayerDetails,
  PlayerIndex,
  PlayerName,
  SocketID,
} from "./types";

const HOT_ZONE = "the hot zone";

type Events = {
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
  NewTilePacket: {
    newTilePacket: Rack;
    inventory: Inventory;
    newLetter?: true;
  };
  UpdateCurrentTilePacket: {
    tiles: Rack;
    inventory: Inventory;
    levelStars: number; // money
    points: number; // total points
    reroll?: number;
    scoringEvents?: Array<{ label: string; score: number }>;
    playerKills?: number;
    playerDied?: true;
    playerKilledBy?: string;
    killedByWord?: string;
  };
  UseBomb: {
    indexesToRemove: Array<number>;
    originIndexes: Array<number>;
  };
  UpdateCurrentItems: {
    inventory: Inventory;
  };
  RequestItemResponse: {
    success: boolean;
    inventory: Inventory;
    levelStars: number;
  };
  RequestUpgradeResponse: {
    success: boolean;
    levelStars: number;
    levelUpgs: Array<"letter_slot" | "timer_decrease" | "item_slot">;
  };
  HPSync: {
    playerHP: number;
  };
  ExitedGas: {
    playerHP: number;
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
type Rack = Array<{ letter: Letter; points: number }>;
type Inventory = Array<{ itemType: Item }>;
type Handlers = {
  [Event in keyof Events]: (payload: Events[Event]) => void;
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

  /**
   * We'll keep copying this into each timeline step
   */
  let player: GameStep["player"];

  const handlers: Handlers = {
    Joined({
      room,
      goldenRoyale,
      gridWidth,
      playerList,
      squaresWithMults,
      squaresWithItems,
    }) {
      hot = [];
      player = { letters: [], rackSize: 5, hp: 100 };
      startIndex = undefined;

      game = {
        id: room,
        golden: goldenRoyale,
        players: indexPlayers(playerList),
        board: {
          size: gridWidth,
          base: Array(gridWidth * gridWidth),
        },
        timeline: [],
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

    EndDropPhase({ startingPosition: { x, y } }) {
      startIndex = game.board.size * y + x;
    },

    SyncNewBoardState({ squaresWithLetters }) {
      if (startIndex !== undefined && game.you.name === "") {
        identifyPlayerOne(squaresWithLetters);
      }

      const state: GameStep = {
        letters: [],
        owners: [],
        hot,
        player,
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

      game.timeline.push(state);
    },

    NewTilePacket({ newTilePacket }) {
      player = {
        ...player,
        letters: newTilePacket.map((t) => t.letter),
      };
    },

    UpdateCurrentTilePacket({ tiles, scoringEvents, playerDied }) {
      player = {
        ...player,
        letters: tiles.map((t) => t.letter),
      };
      if (playerDied) {
        player.hp = 0;
      }
      if (tiles.length === 0 && !scoringEvents) {
        // This is an overload, so merged it with the bomb we've just applied
        // instead of waiting for the next board sync to apply it
        // This is based on an assumption that there won't be any other board
        // events in between the UseBomb and this event for an overload
        game.timeline[game.timeline.length - 1].player = player;
      }
    },

    UseBomb({ indexesToRemove }) {
      const last = game.timeline[game.timeline.length - 1];
      const letters = last.letters.slice();
      indexesToRemove.forEach((i) => {
        delete letters[i];
      });
      game.timeline.push({ ...last, letters });
    },

    UpdateCurrentItems() {},

    RequestItemResponse() {},

    RequestUpgradeResponse({ success, levelUpgs }) {
      if (!success) return;
      player = {
        ...player,
        rackSize: 5 + levelUpgs.filter((u) => u === "letter_slot").length,
      };
    },

    HPSync({ playerHP: hp }) {
      player = { ...player, hp };
    },
    ExitedGas({ playerHP: hp }) {
      player = { ...player, hp };
    },

    NewPlayerDeath({ playerName: player, playerKilledBy: by, killedByWord }) {
      if (by === HOT_ZONE) {
        game.kills.push({ type: "hot", player });
      } else {
        game.kills.push({ type: "word", player, by, word: killedByWord });
      }
    },

    EndGame({ winnerIndex }) {
      game.winner = game.players[winnerIndex].name;
    },

    FinalItemsAndMMR({ newMMR, oldMMR, placement }) {
      game.you = {
        name: game.you.name,
        MMR: newMMR,
        oldMMR,
        position: placement,
      };
    },

    CloseCircleChunk({ indexesToClose }) {
      hot = hot.slice();
      indexesToClose.forEach((i) => {
        hot[i] = "hot";
      });
    },

    CloseCircle({ indexesToClose }) {
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
