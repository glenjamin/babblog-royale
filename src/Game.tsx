import { useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import { Bonus, Letter, PlayerName, Game, PlayerIndex } from "./types";

import styles from "./Game.module.css";

interface GameViewerProps {
  games: Game[];
  showImport(): void;
}
function GameViewer({ games, showImport }: GameViewerProps): JSX.Element {
  const [game, setGame] = useState<Game>();
  return (
    <Container fluid>
      <Row>
        <Col>{game && <GameGrid key={game.id} game={game} />}</Col>
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
  const state = game.board.timeline[game.board.timeline.length - 1];
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
  0: "blue",
  1: "red",
  2: "orange",
  3: "purple",
  4: "green",
  5: "yellow",
  6: "cyan",
  7: "magenta",
  8: "darkblue",
  9: "forestgreen",
  10: "olive",
  11: "brown",
  12: "darkred",
  13: "pink",
  14: "gold",
  15: "silver",
} as const;

interface LetterProps {
  letter: Letter;
  owner: PlayerIndex | null;
}
function LetterCell({ letter, owner }: LetterProps): JSX.Element {
  return (
    <div
      className={styles.letter}
      style={owner ? { backgroundColor: ownerColours[owner] } : undefined}
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
