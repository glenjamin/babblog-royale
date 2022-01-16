import path from "path";
import { createReadStream } from "fs";

import { newParser } from "./parser";
import { Game } from "./types";

async function parseSample(name: string): Promise<Game[]> {
  const parser = newParser();

  const filename = path.resolve(__dirname, "../sample-logs", name + ".log");
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filename);
    stream
      .on("data", (chunk) => parser.parse(chunk.toString()))
      .on("error", reject);
    stream.once("end", () => {
      parser.end();
      resolve(parser.games());
    });
  });
}

describe("Parsing", () => {
  describe("died to the hot zone", () => {
    let games: Game[];
    let game: Game;
    beforeAll(async () => {
      games = await parseSample("died-to-hot-zone");
      [game] = games;
    });
    it("should parse one game", () => {
      expect(games).toHaveLength(1);
    });
    it("should detect the player", () => {
      console.dir(game.timeline);
      expect(game).toHaveProperty("you.name", "Glenjamin");
    });
  });
});
