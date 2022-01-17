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
  let games: Game[];
  let game: Game;

  describe("died to the hot zone", () => {
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

  describe("disconnected immediately", () => {
    beforeAll(async () => {
      games = await parseSample("immediate-disconnect");
      [game] = games;
    });

    it("should still have a game", () => {
      expect(games).toHaveLength(1);
    });
    it("should have an empty placeholder state", () => {
      expect(game.timeline).toHaveLength(1);
      expect(game.timeline[0].letters).toHaveLength(0);
    });
  });
});
