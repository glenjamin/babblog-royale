import { useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import {
  Bonus,
  Letter,
  PlayerName,
  Game,
  PlayerIndex,
  SocketID,
  PlayerDetails,
} from "./types";

import styles from "./Game.module.css";

const players: PlayerDetails[] = [
  "JohnL",
  "PaulMcC",
  "George",
  "Ringo",
  "David",
  "Freddie",
  "BrianM",
  "Roger",
  "JohnD",
  "Mick",
  "BrianJ",
  "Keith",
  "Bill",
  "Charlie",
  "Simon",
  "PaulG",
].map((name, i) => ({
  name: name as PlayerName,
  socketID: ("xx_" + name) as SocketID,
  index: i as PlayerIndex,
}));

const initialGame: Game = {
  id: 0,
  golden: true,
  players,
  board: {
    size: 31,
    base: [],
    timeline: [{ letters: [], owners: [] }],
  },
  kills: [],
  winner: null,
  you: {
    MMR: 0,
    oldMMR: 0,
    position: 0,
  },
};

[
  "the",
  "first",
  "and",
  "original",
  "babble",
  "royale",
  "player",
  "log",
  "file",
  "viewer",
  "made",
  "by",
  "glenjamin",
  "aka",
  "glenathan",
].forEach((word, i) => {
  const player = players[i];
  const offset = 1 + (1 + i * 2) * initialGame.board.size;
  Array.from(word).forEach((letter, i) => {
    initialGame.board.timeline[0].letters[offset + i] = letter as Letter;
    initialGame.board.timeline[0].owners[offset + i] = player.name;
  });
});

interface GameViewerProps {
  games: Game[];
  showImport(): void;
}
function GameViewer({ games, showImport }: GameViewerProps): JSX.Element {
  const [game, setGame] = useState<Game>();
  return (
    <Container fluid>
      <Row>
        <Col>
          <GameGrid game={game || initialGame} />
        </Col>
        <Col className="p-3">
          {games.length === 0 ? (
            <Row>
              <Col className="text-center">
                <Button
                  variant="outline-secondary"
                  size="lg"
                  onClick={() => showImport()}
                >
                  Import Logs...
                </Button>
              </Col>
            </Row>
          ) : (
            <Row>
              <Form.Select
                onChange={(e) => setGame(games[parseFloat(e.target.value)])}
              >
                <option value="-1">Select a game</option>
                {games.map((game, index) => (
                  <option key={game.id} value={index}>
                    Game #{game.id}: Position {game.you.position} to MRR{" "}
                    {Math.round(game.you.MMR)}
                  </option>
                ))}
              </Form.Select>
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
}

interface GameGridProps {
  game: Game;
}
function GameGrid({ game }: GameGridProps) {
  const size = game.board.size;
  const range = Array(size).fill(0);
  const state = game.board.timeline[0];
  const playerIndexes = {} as Record<PlayerName, PlayerIndex>;
  game.players.forEach((p) => {
    playerIndexes[p.name] = p.index;
  });
  return (
    <table cellSpacing={0} cellPadding={0} className={styles.board}>
      <tbody>
        {range.map((_, row) => (
          <tr key={row}>
            {range
              .map((_, col) => {
                const index = row * size + col;
                const letter = state.letters[index];
                const owner = state.owners[index];
                if (letter) {
                  return (
                    <LetterCell
                      letter={letter}
                      owner={owner && playerIndexes[owner]}
                    />
                  );
                }
                const bonus = game.board.base[index];
                if (bonus) {
                  return <BonusCell bonus={bonus} />;
                }
                return <EmptyCell />;
              })
              .map((cell, col) => (
                <td key={col}>{cell}</td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyCell() {
  return <div className={styles.empty} />;
}

const ownerColours = {
  0: "#68D", // blue
  1: "#c4e", // violet
  2: "#862", // gold
  3: "#4c1", // lime
  4: "#596", // teal
  5: "#f55", // rose
  6: "#170", // green
  7: "#d01", // red
  8: "#099", // cyan
  9: "#d42", // orange
  10: "#a26", //pink
  11: "#dc1", // yellow
  12: "#773", // olive
  13: "#11a", // dark blue
  14: "#561", // dark olive
  15: "#d99", //darkred
} as const;

interface LetterProps {
  letter: Letter;
  owner: PlayerIndex | null;
}
function LetterCell({ letter, owner }: LetterProps): JSX.Element {
  return (
    <div
      className={styles.letter}
      style={
        owner !== null ? { backgroundColor: ownerColours[owner] } : undefined
      }
    >
      {letter.toUpperCase()}
    </div>
  );
}

const bonusTypeMap = {
  "2x_word": "bonusWord",
  "3x_word": "bonusWord",
  "3x_letter": "bonusLetter",
  "5x_letter": "bonusLetter",
  bomb: "bonusItem",
  medkit: "bonusItem",
  reroll_all: "bonusItem",
  letter_s: "bonusItem",
} as const;

const bonusContentMap = {
  "2x_word": "2x Wd",
  "3x_word": "3x Wd",
  "3x_letter": "3x Lt",
  "5x_letter": "5x Lt",
  bomb: "💣",
  medkit: "➕",
  reroll_all: "♺",
  letter_s: "🅂",
} as const;

interface BonusProps {
  bonus: Bonus;
}
function BonusCell({ bonus }: BonusProps): JSX.Element {
  return (
    <div className={styles[bonusTypeMap[bonus]]}>{bonusContentMap[bonus]}</div>
  );
}

export default GameViewer;
