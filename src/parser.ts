import {
  Bonus,
  Game,
  GameStep,
  Item,
  Letter,
  PlayerDetails,
  PlayerIndex,
  PlayerMetrics,
  PlayerName,
  SocketID,
} from "./types";

const HOT_ZONE = "the hot zone";

type Events = {
  ServerLoginConfirmation: {
    xpLevels: Array<number>;
  };
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
  LetterCostSync: {
    instantLetterCost: number;
    levelStars: number;
  };
  LevelStarSync: {
    levelStars: number;
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

export const emptyMetrics: PlayerMetrics[] = Array(16)
  .fill(0)
  .map(() => ({
    score: 0,
    kills: 0,
  }));

const emptyStep: GameStep = {
  hot: [],
  letters: [],
  owners: [],
  metrics: emptyMetrics,
  player: {
    letters: [],
    rackSize: 5,
    items: [],
    itemSlots: 1,
    hp: 100,
    words: [],
    money: 0,
    points: 0,
  },
  bombed: [],
};

export function newParser() {
  const games: Array<typeof game> = [];

  /** The level boundaries */
  let levels: Array<number>;

  /** The game currently being parsed */
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
    ServerLoginConfirmation({ xpLevels }) {
      levels = xpLevels;
    },
    Joined({
      room,
      goldenRoyale,
      gridWidth,
      playerList,
      squaresWithMults,
      squaresWithItems,
    }) {
      hot = [];
      player = emptyStep.player;
      startIndex = undefined;

      game = {
        id: room,
        golden: goldenRoyale,
        players: indexPlayers(playerList),
        levels,
        board: {
          size: gridWidth,
          base: Array(gridWidth * gridWidth),
        },
        timeline: [emptyStep],
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

    SyncNewBoardState({ squaresWithLetters, playerScores }) {
      if (startIndex !== undefined && game.you.name === "") {
        identifyPlayerOne(squaresWithLetters);
      }

      const letters: GameStep["letters"] = [];
      const owners: GameStep["owners"] = [];

      squaresWithLetters.forEach(({ index, letter, playerLivingOn }) => {
        letters[index] = letter;
        if (playerLivingOn) {
          const player = game.players.find(
            ({ socketID }) => socketID === playerLivingOn
          );
          if (player) owners[index] = player.index;
        }
      });

      const timeline = game.timeline;
      const lastMetrics: GameStep["metrics"] =
        timeline[timeline.length - 1].metrics;
      const metrics = lastMetrics.map((m) => ({ ...m }));
      playerScores.forEach(({ socketID, score }) => {
        const index = findPlayerIndexBySocketID(socketID);
        metrics[index].score = score;
      });

      // Have we noted a kill for the step we're about to add?
      const lastKill = game.kills[game.kills.length - 1];
      if (lastKill && timeline.length === lastKill.step) {
        // If it was killed by a player, up their kill count
        if (lastKill.type === "word") {
          metrics[lastKill.by].kills += 1;
        }
      }

      addGameStep({ letters, owners, metrics });
    },

    UseBomb({ indexesToRemove, originIndexes }) {
      const last = game.timeline[game.timeline.length - 1];

      // TODO: record bomb sources somewhere?
      // const ownerIndex = last.owners[originIndexes[0]];
      // if (ownerIndex) {
      //   const owner = game.players[ownerIndex];
      // }

      const letters = last.letters.slice();
      const bombed: GameStep["bombed"] = [];
      indexesToRemove.forEach((i) => {
        delete letters[i];
      });
      originIndexes.forEach((i) => {
        bombed[i] = true;
      });
      addGameStep({ letters, bombed });
    },

    NewTilePacket({ newTilePacket, inventory, newLetter }) {
      updatePlayer({ tiles: newTilePacket, inventory });
      addGameStep({});
    },

    UpdateCurrentTilePacket({
      tiles,
      points,
      levelStars,
      scoringEvents,
      playerDied,
    }) {
      const update: PlayerUpdate = {
        points,
        levelStars,
        tiles,
      };
      if (playerDied) {
        update.hp = 0;
      }
      if (scoringEvents) {
        update.words = scoringEvents
          .map(({ label }) => label)
          .filter((word) => !word.includes(" "));
      }

      updatePlayer(update);

      if (tiles.length === 0 && !scoringEvents && !playerDied) {
        // This is an overload, so merge it with the bomb we've just applied
        // instead of waiting for the next board sync to apply it
        // This is based on an assumption that there won't be any other board
        // events in between the UseBomb and this event for an overload
        game.timeline[game.timeline.length - 1].player = player;
      }
    },

    UpdateCurrentItems({ inventory }) {
      updatePlayer({ inventory });
    },

    RequestItemResponse({ success, levelStars, inventory }) {
      if (!success) return;
      updatePlayer({ levelStars, inventory });
      addGameStep({});
    },

    RequestUpgradeResponse({ success, levelStars, levelUpgs }) {
      if (!success) return;
      updatePlayer({
        levelStars,
        rackSize: 5 + levelUpgs.filter((u) => u === "letter_slot").length,
        itemSlots: 1 + levelUpgs.filter((u) => u === "item_slot").length,
      });
    },

    LetterCostSync({ levelStars }) {
      updatePlayer({ levelStars });
    },
    LevelStarSync({ levelStars }) {
      updatePlayer({ levelStars });
    },

    HPSync({ playerHP: hp }) {
      updatePlayer({ hp });
    },
    ExitedGas({ playerHP: hp }) {
      updatePlayer({ hp });
    },

    NewPlayerDeath({ playerName, playerKilledBy: by, killedByWord }) {
      const step = game.timeline.length;
      const player = game.players.find((p) => p.name === playerName);
      if (!player) return;

      player.killedStep = step;
      if (by === HOT_ZONE) {
        game.kills.push({ type: "hot", player: player.index, step });
      } else {
        const killer = game.players.find((p) => p.name === by)!;
        game.kills.push({
          type: "word",
          player: player.index,
          by: killer.index,
          word: killedByWord,
          step,
        });
      }
    },

    EndGame({ winnerIndex }) {
      game.winner = game.players[winnerIndex].name;
    },

    FinalItemsAndMMR({ newMMR, oldMMR, placement }) {
      game.you = {
        ...game.you,
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

  type PlayerUpdate = Partial<
    Omit<GameStep["player"], "money" | "inventory" | "letters"> & {
      levelStars: number;
      inventory: Array<{ itemType: Item }>;
      tiles: Array<{ letter: Letter }>;
    }
  >;
  function updatePlayer(update: PlayerUpdate) {
    const { levelStars, inventory, tiles, ...compatible } = update;
    const newPlayer: GameStep["player"] = { ...player, ...compatible };
    if (levelStars !== undefined) newPlayer.money = levelStars;
    // TODO: if the player is losing a bomb, apply it on the correct event
    // Usually the inventory sync event comes a bit later
    if (inventory) newPlayer.items = inventory.map((i) => i.itemType);
    if (tiles) newPlayer.letters = tiles.map((t) => t.letter);

    player = newPlayer;
  }

  function addGameStep(
    step: Partial<Pick<GameStep, "letters" | "owners" | "metrics" | "bombed">>
  ) {
    // If we don't have any real steps yet
    if (game.timeline[0] === emptyStep) {
      // Don't create a step until we have letters
      // this applies to item collections and new tiles
      if (!step.letters) {
        return;
      }
      // Once we do have letters, we can discard the placeholder empty step
      game.timeline.pop();
    }

    const last = game.timeline[game.timeline.length - 1];
    game.timeline.push({
      ...last,
      player,
      hot,
      bombed: [],
      ...step,
    });

    // Only use player.words once
    if (player.words.length) {
      updatePlayer({ words: [] });
    }
  }

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

  const findPlayerIndexBySocketID = (socketID: SocketID) => {
    return game.players.findIndex((player) => player.socketID === socketID);
  };

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
      return games.filter((game) => !isGameMalformed(game));
    },
  };
}

const isGameMalformed = (game: Game) => {
  // TODO: Make this function more thorough
  return game.timeline.length === 0;
};

function indexPlayers(players: Omit<PlayerDetails, "index" | "killedStep">[]) {
  return players.map(({ name, socketID }, index) => ({
    socketID,
    name,
    index: playerIndex(index),
    killedStep: null,
  }));
}

function playerIndex(i: number): PlayerIndex {
  if (i < 0 || i > 15) {
    throw new Error("invalid player index");
  }
  return i as any;
}
