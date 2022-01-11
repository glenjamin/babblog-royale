# babblog-royale

Babble Royale log parser and viewer

[Open the Web App](https://babblog-royale.netlify.app/)

![Sample of the viewer in use](https://user-images.githubusercontent.com/151272/148801659-3cc06acf-5f86-4d0e-99d6-c391cd9f0e41.png)

## Overview

The UI allows you to load a game and browse backwards and forwards though the board states.

The underlying log parser currently handles:

- Extracting games
- Players per game
- Kills per game
- Game winner (if you stayed to the end)
- Your MMR change and position
- Each board state

## Roadmap

- Keep track of when items get collected
- Show kills and wins on the UI
- Show the scoreboard progress on the UI
- Include the hot zone
- Figure out which player is the current player and make them always blue
- Include player tiles / HP
- Figure out which words/bombs people played
- Allow export/import of individual parsed games
- Allow sharing links to games

If you have more ideas or suggestions, please open an issue on GitHub.

## Commandline usage

With Node.js installed, run `main.js` with a file.

```sh
Usage: node parser.js <path-to-babble-royale-player-log>

On macOS the file is at '~/Library/Logs/Everybody House Games/BabbleRoyale/Player.log'
On windows the file is at 'C:\\Users\\[YOURUSERNAME]\\AppData\\LocalLow\\Everybody House Games\\BabbleRoyale\\Player.log'
```

eg

```sh
> node main.js ~/Library/Logs/Everybody\ House\ Games/BabbleRoyale/Player.log
{
  games: [
    {
      players: [
        { name: 'kwakquack' },
        { name: 'Giles' },
        { name: 'A113z' },
        { name: 'yuzu' },
        { name: 'VulpesVulpes' },
        { name: 'Iamgurp' },
        { name: 'mega' },
        { name: 'FutureIdol' },
        { name: 'RollDad20' },
        { name: 'Incred' },
        { name: 'Baron' },
        { name: 'nickrules1995' },
        { name: 'axcertypo' },
        { name: 'Glenjamin' },
        { name: '20thcenturyboy' },
        { name: 'Extol' }
      ],
      boards: [],
      kills: [
        { type: 'word', name: 'Incred', killer: 'Giles', word: 'ea' },
        {
          type: 'word',
          name: 'Iamgurp',
          killer: 'nickrules1995',
          word: 'ae'
        },
        {
          type: 'word',
          name: 'FutureIdol',
          killer: 'axcertypo',
          word: 'ode'
        },
        {
          type: 'word',
          name: 'RollDad20',
          killer: 'kwakquack',
          word: 'een'
        },
        { type: 'word', name: 'mega', killer: 'Extol', word: 'bib' },
        {
          type: 'word',
          name: '20thcenturyboy',
          killer: 'axcertypo',
          word: 'naves'
        },
        {
          type: 'word',
          name: 'VulpesVulpes',
          killer: 'axcertypo',
          word: 'agas'
        },
        {
          type: 'word',
          name: 'Giles',
          killer: 'kwakquack',
          word: 'ret'
        },
        {
          type: 'word',
          name: 'A113z',
          killer: 'kwakquack',
          word: 'as'
        },
        {
          type: 'word',
          name: 'Baron',
          killer: 'axcertypo',
          word: 'dine'
        },
        {
          type: 'word',
          name: 'nickrules1995',
          killer: 'axcertypo',
          word: 'tame'
        },
        {
          type: 'word',
          name: 'Extol',
          killer: 'axcertypo',
          word: 'beet'
        },
        {
          type: 'word',
          name: 'kwakquack',
          killer: 'axcertypo',
          word: 'eel'
        },
        { type: 'hot', name: 'yuzu' },
        {
          type: 'word',
          name: 'Glenjamin',
          killer: 'axcertypo',
          word: 'lute'
        }
      ],
      winner: { name: 'axcertypo' },
      you: { MRR: 9695.433836417875, oldMMR: 9634.9130859375, position: 2 }
    }
  ]
}
```

## License

MIT
