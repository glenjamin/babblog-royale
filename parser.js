const fs = require("fs");
const readline = require("readline");

/**
 * @typedef {{
 *   name: string
 * }} Player
 *
 * @typedef {{
 *   { type: 'hot' } & Player
 *   | { type: 'word', killer: string, word: string } & Player
 * }} Kill
 *
 * @typedef {{
 *  players: Player[],
 *  kills: Kill[],
 *  winner: Player | null,
 * }} Game
 */

const HOT_ZONE = "the hot zone";

/**
 * @param {Player[]} players
 *
 * @returns {Game}
 */
function newGame(players) {
  return {
    players: players.map(({ name }) => ({ name })),
    kills: [],
    winner: null,
  };
}

function newParser() {
  /**
   * @type {Game[]}
   */
  const games = [];
  /**
   * @type {Game}
   */
  let game;
  const handlers = {
    /**
     * @param {{
     *   playerList: Player[]
     * }} payload
     */
    Joined(payload) {
      game = newGame(payload.playerList);
      games.push(game);
    },
    /**
     *
     * @param {{
     *  playerName: string,
     *  playerKilledBy: string,
     *  killedByWord: string,
     * }} payload
     */
    NewPlayerDeath({ playerName, playerKilledBy, killedByWord }) {
      if (playerKilledBy == HOT_ZONE) {
        game.kills.push({ type: "hot", name: playerName });
      } else {
        game.kills.push({
          type: "word",
          name: playerName,
          killer: playerKilledBy,
          word: killedByWord,
        });
      }
    },

    /**
     *
     * @param {{
     *   winnerIndex: number
     * }} payload
     */
    EndGame(payload) {
      game.winner = game.players[payload.winnerIndex];
    },
  };

  return {
    /**
     * @param {string} line
     */
    parse(line) {
      if (line[0] != "[" || line[1] != '"') return;
      const [event, payload] = JSON.parse(line);
      const handler = handlers[event];
      if (handler) handler(payload);
    },
    dump() {
      return { games };
    },
  };
}

if (require.main === module) {
  const filename = process.argv[2];
  if (!filename) {
    console.warn(`Usage: node parser.js <path-to-babble-royale-player-log>
    
On macOS the file is at '~/Library/Logs/Everybody House Games/BabbleRoyale/Player.log'
On windows the file is at 'C:\\Users\\[YOURUSERNAME]\\AppData\\LocalLow\\Everybody House Games\\BabbleRoyale\\Player.log'
`);
    process.exit(1);
  }
  const parser = newParser();
  const stream = readline.createInterface({
    input: fs.createReadStream(filename),
    crlfDelay: Infinity,
  });
  stream.on("line", (line) => {
    parser.parse(line);
  });
  stream.once("close", () => {
    console.dir(parser.dump(), { depth: 5 });
  });
}
