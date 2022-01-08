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
    Joined({ room, goldenRoyale, playerList }) {
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
          base: [], // TODO: bonus tiles
          steps: [],
        },
        kills: [],
        winner: null,
        you: {
          MMR: 0,
          oldMMR: 0,
          position: 0,
        },
      };
      games.push(game);
    },

    /**
     * @param {Events['SyncNewBoardState']} payload
     */
    SyncNewBoardState(payload) {
      // console.log(payload);
      // TODO: append to steps
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
