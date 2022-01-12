const HOT_ZONE = "the hot zone";

/**
 * @typedef { import("./types").Game } Game
 * @typedef { import("./types").Events } Events
 */

export function newParser() {
  /**
   * @type {Array<typeof game>}
   */
  const games = [];

  /**
   * @type {Game}
   */
  let game;

  /**
   * Keep track of the starting position,
   * so we can figure out who the player is from the first board sync
   *
   * @type {number | undefined}
   */
  let startIndex;

  /**
   * We'll keep copying this array into each timeline step
   * @type {Array<"hot" | "warm">}
   */
  let hot = [];

  const handlers = {
    /**
     * @param {Events['Joined']} payload
     */
    Joined({
      room,
      goldenRoyale,
      gridWidth,
      playerList,
      squaresWithMults,
      squaresWithItems,
    }) {
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
          name: /** @type {import("./types").PlayerName} */ (""),
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

    /**
     * @param {Events['EndDropPhase']} payload
     */
    EndDropPhase({ startingPosition: { x, y } }) {
      startIndex = game.board.size * y + x;
    },

    /**
     * @param {Events['SyncNewBoardState']} payload
     */
    SyncNewBoardState({ squaresWithLetters }) {
      if (startIndex && game.you.name === "") {
        identifyPlayerOne(squaresWithLetters);
      }

      /**
       * @type {Game['board']['timeline'][0]}
       */
      const state = {
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

    /**
     * @param {Events['NewPlayerDeath']} payload
     */
    NewPlayerDeath({ playerName: player, playerKilledBy: by, killedByWord }) {
      if (by === HOT_ZONE) {
        game.kills.push({ type: "hot", player });
      } else {
        game.kills.push({ type: "word", player, by, word: killedByWord });
      }
    },

    /**
     * @param {Events['EndGame']} payload
     */
    EndGame({ winnerIndex }) {
      game.winner = game.players[winnerIndex].name;
    },

    /**
     * @param {Events['FinalItemsAndMMR']} payload
     */
    FinalItemsAndMMR({ newMMR, oldMMR, placement }) {
      game.you = {
        name: game.you.name,
        MMR: newMMR,
        oldMMR,
        position: placement,
      };
    },

    /**
     * @param {Events['CloseCircleChunk']} payload
     */
    CloseCircleChunk({ indexesToClose }) {
      hot = hot.slice();
      indexesToClose.forEach((i) => {
        hot[i] = "hot";
      });
    },

    /**
     * @param {Events['CloseCircle']} payload
     */
    CloseCircle({ indexesToClose }) {
      hot = hot.slice();
      indexesToClose.forEach((i) => {
        if (!hot[i]) hot[i] = "warm";
      });
    },
  };

  /**
   * @param {Events['SyncNewBoardState']['squaresWithLetters']} squares
   */
  function identifyPlayerOne(squares) {
    const square = squares.find(({ index }) => index === startIndex);
    if (!square?.playerLivingOn) {
      game.you.name = /** @type {import("./types").PlayerName} */ ("uknnown");
      return;
    }
    /** @type {import("./types").PlayerDetails[]} */
    const newPlayers = [];
    game.players.forEach((player) => {
      if (player.socketID === square.playerLivingOn) {
        newPlayers.unshift(player);
      } else {
        newPlayers.push(player);
      }
    });
    game.players = indexPlayers(newPlayers);
  }

  let buffer = "";
  /**
   * @param {string} line
   */
  function handleLine(line) {
    if (line[0] !== "[" || line[1] !== '"') return;
    /**
     * @type [keyof Events, any]
     */
    const [event, payload] = JSON.parse(line);
    const handler = handlers[event];
    if (handler) handler(payload);
  }

  return {
    /**
     * @param {string} chunk
     */
    parse(chunk) {
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

/**
 * @param {Omit<import("./types").PlayerDetails, "index">[]} players
 */
function indexPlayers(players) {
  return players.map(({ name, socketID }, index) => ({
    socketID,
    name,
    index: playerIndex(index),
  }));
}

/**
 * @param {number} i
 * @returns {import("./types").PlayerIndex}
 */
function playerIndex(i) {
  if (i < 0 || i > 15) {
    throw new Error("invalid player index");
  }
  return /** @type {any} */ (i);
}
