// @ts-nocheck
const fs = require("fs");

process.env.BABEL_ENV ??= "test";
require("@babel/register")({
  presets: ["react-app"],
  extensions: [".ts"],
});

const { tileValues } = require("./src/constants");

const wordsFile = "./words.json";

const words = JSON.parse(fs.readFileSync(wordsFile, "utf8"));

const sorted = words
  .sort((a, b) => {
    let aValue = 0;
    let bValue = 0;
    for (let i = 0; i < a.length; i++) {
      aValue += tileValues(a[i]);
    }
    for (let i = 0; i < b.length; i++) {
      bValue += tileValues(b[i]);
    }
    return aValue - bValue;
  })
  .reverse();

fs.writeFileSync(wordsFile, JSON.stringify(sorted));
