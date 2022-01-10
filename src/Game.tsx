import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

import { Bonus, Letter, PlayerName, Game } from "./types";

import styles from "./Game.module.css";
import { newParser } from "./parser.mjs";
import { useState } from "react";

function GameViewer() {
  const [games, setGames] = useState<Game[]>([]);

  async function parseFile(file: Blob) {
    console.log("handling...");
    const parser = newParser();
    // The type cast is required because @types/node messes with the DOM type
    // See https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/58079
    const reader = (file.stream() as unknown as ReadableStream).getReader();
    // TODO: use TextDecoder to handle possible codepoint boundaries?
    const utf8Decoder = new TextDecoder("utf-8");
    while (true) {
      let { value, done } = await reader.read();
      console.log("decoding...");
      const chunk = utf8Decoder.decode(value, { stream: !done });
      parser.parse(chunk);
      if (done) break;
    }
    parser.end();
    setGames(parser.dump().games);
  }
  return (
    <Container fluid>
      <Row>
        <Col>
          <GameGrid />
        </Col>
        <Col className="p-3">
          <Form>
            <Form.Group as={Row} controlId="logFile" className="mb-3">
              <Form.Label column sm={2}>
                Log File
              </Form.Label>
              <Col>
                <Form.Control
                  type="file"
                  aria-describedby="logFileHelp"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    parseFile(e.target.files?.[0]!)
                  }
                />
              </Col>
              <Form.Text id="logFileHelp" muted>
                On Windows this can be found at{" "}
                <code>
                  C:\Users\[YOURUSERNAME]\AppData\LocalLow\Everybody House
                  Games\BabbleRoyale\Player.log
                </code>
                .
                <br />
                On macOS this can be found at{" "}
                <code>
                  ~/Library/Logs/Everybody House Games/BabbleRoyale/Player.log
                </code>
                .
              </Form.Text>
            </Form.Group>
          </Form>
          {games.map((game) => (
            <p key={game.id}>
              {game.id}: won by {game.winner}
            </p>
          ))}
        </Col>
      </Row>
    </Container>
  );
}

function GameGrid() {
  const size = 31;
  const range = Array(size).fill(0);
  return (
    <table cellSpacing={0} cellPadding={0} className={styles.board}>
      <tbody>
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
      </tbody>
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

export default GameViewer;
