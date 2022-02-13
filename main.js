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
  printAllWords(games);
});

/**
 *
 * @param {import("./src/types").Game[]} games
 */
function printAllWords(games) {
  games.forEach((game) => {
    console.log("-- Game #%d --", game.id);
    game.timeline.forEach((step) => {
      if (step.player.words.length) {
        console.log(step.player.words.join(" "));
      }
    });
  });
}
