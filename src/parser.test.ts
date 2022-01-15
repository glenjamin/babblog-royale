import path from "path";
import { createReadStream } from "fs";

import { newParser } from "./parser.mjs";
import { Game } from "./types.js";

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
  it("should parse something", async () => {
    const games = await parseSample("died-to-hot-zone");
    console.log(games);
  });
});
