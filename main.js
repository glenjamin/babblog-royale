const fs = require("fs");

process.env.BABEL_ENV ??= "test";
require("@babel/register")({
  presets: ["react-app"],
  extensions: [".ts"],
});

const { newParser } = require("./src/parser");

const filename = process.argv[2];
if (!filename) {
  console.warn(`Usage: node main.js <path-to-babble-royale-player-log>
    
On macOS the file is at '~/Library/Logs/Everybody House Games/BabbleRoyale/Player.log'
On windows the file is at 'C:\\Users\\[YOURUSERNAME]\\AppData\\LocalLow\\Everybody House Games\\BabbleRoyale\\Player.log'
`);
  process.exit(1);
}
const parser = newParser();
const stream = fs.createReadStream(filename);
stream.on("data", (chunk) => parser.parse(chunk.toString()));
stream.once("close", () => {
  parser.end();
  const games = parser.games();
  console.dir(games, { depth: 6 });

  const last = games[games.length - 1];

  printBoard(last.board);
});

/**
 *
 * @param {import("./src/types.js").Game['board']} board
 */
function printBoard(board) {
  const side = board.size;
  const squares = side * side;

  const grids = board.timeline.map((step) => {
    /**
     * @type string[][]
     */
    const grid = Array(side)
      .fill(0)
      .map(() => []);
    for (let i = 0; i < squares; i++) {
      const row = Math.floor(i / side);
      const col = i % side;
      grid[row][col] = step.letters[i] || ".";
    }
    return grid.map((row) => row.join("")).join("\n");
  });

  grids.forEach((grid, i) => {
    console.log("Step %d:\n%s\n", i, grid);
  });
}
