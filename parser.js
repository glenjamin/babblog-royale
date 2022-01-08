const HOT_ZONE = "the hot zone";

/**
 * @typedef { import("./types").Game } Game
 * @typedef { import("./types").Events} Events
 */

export function newParser() {
  /**
   * @type {Game}
   */
  let game;

  /**
   * @type {Array<typeof game>}
   */
  const games = [];

  const handlers = {
    /**
     * @param {Events['Joined']} payload
     */
    Joined({
      room,
      goldenRoyale,
      playerList,
      squaresWithMults,
      squaresWithItems,
    }) {
      game = {
        id: room,
        golden: goldenRoyale,
        players: playerList.map(({ name, socketID }, index) => ({
          socketID,
          name,
          index,
        })),
        board: {
          size: 32,
          base: Array(1024),
          timeline: [],
        },
        kills: [],
        winner: null,
        you: {
          MMR: 0,
          oldMMR: 0,
          position: 0,
        },
      };

      squaresWithMults.forEach(({ index, wordScoreMult }) => {
        game.board.base[index] = wordScoreMult == 2 ? "2x_word" : "3x_word";
      });
      squaresWithItems.forEach(({ index, itemOnSquare }) => {
        game.board.base[index] = itemOnSquare;
      });

      games.push(game);
    },

    /**
     * @param {Events['SyncNewBoardState']} payload
     */
    SyncNewBoardState({ squaresWithLetters }) {
      /**
       * @type {Game['board']['timeline'][0]}
       */
      const state = {
        letters: Array(1024),
        owners: Array(1024),
      };

      squaresWithLetters.forEach(({ index, letter, playerLivingOn }) => {
        state.letters[index] = letter;
        if (playerLivingOn) {
          const player = game.players.find(
            ({ socketID }) => socketID == playerLivingOn
          );
          state.owners[index] = player ? player.name : null;
        }
      });

      game.board.timeline.push(state);
    },

    /**
     * @param {Events['NewPlayerDeath']} payload
     */
    NewPlayerDeath({ playerName: player, playerKilledBy: by, killedByWord }) {
      if (by == HOT_ZONE) {
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
        MMR: newMMR,
        oldMMR,
        position: placement,
      };
    },
  };

  let buffer = "";
  /**
   * @param {string} line
   */
  function handleLine(line) {
    if (line[0] != "[" || line[1] != '"') return;
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
    dump() {
      return { games };
    },
  };
}
