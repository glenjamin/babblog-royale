import fs from "fs";
import { newParser } from "./parser.js";

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
  console.dir(parser.dump(), { depth: 5 });
});
