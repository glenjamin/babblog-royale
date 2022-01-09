import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { Bonus, Letter, PlayerName } from "./types";

import styles from "./Game.module.css";

function Game() {
  return (
    <Container fluid>
      <Row>
        <Col>
          <GameGrid />
        </Col>
        <Col>Sidebar</Col>
      </Row>
    </Container>
  );
}

function GameGrid() {
  const size = 31;
  const range = Array(size).fill(0);
  return (
    <table cellSpacing={0} cellPadding={0} className={styles.board}>
      {range.map((_, row) => (
        <tr key={row}>
          {range.map((_, col) => (
            <td key={col}>
              {Math.random() > 0.9 ? (
                <LetterCell
                  letter={
                    String.fromCharCode(
                      97 + Math.floor(Math.random() * 26)
                    ) as any
                  }
                  owner={null}
                />
              ) : Math.random() > 0.95 ? (
                <BonusCell
                  bonus={
                    Object.keys(bonusContentMap)[
                      Math.floor(Math.random() * 8)
                    ] as any
                  }
                />
              ) : (
                <EmptyCell />
              )}
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function EmptyCell() {
  return <div className={styles.empty} />;
}

interface LetterProps {
  letter: Letter;
  owner: PlayerName | null;
}
function LetterCell({ letter, owner }: LetterProps): JSX.Element {
  return <div className={styles.letter}>{letter.toUpperCase()}</div>;
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

export default Game;
