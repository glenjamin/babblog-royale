import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";

import { GameStep } from "./types";
import { EmptyCell, LetterCell } from "./GameGrid";

function PlayerState({
  letters,
  rackSize,
  hp,
}: GameStep["player"]): JSX.Element {
  return (
    <Row className="justify-content-sm-center my-3">
      <Col className="d-flex" sm="auto">
        {letters.map((letter, i) => (
          <LetterCell key={i} letter={letter} />
        ))}
        {new Array(rackSize - letters.length).fill(0).map((_, i) => (
          <EmptyCell />
        ))}
        <div className="ms-3">
          {hp > 0 ? (
            <Badge
              pill
              bg={hp > 70 ? "success" : hp > 30 ? "warning" : "danger"}
            >
              {Math.round(hp)}
            </Badge>
          ) : (
            "☠️"
          )}
        </div>
      </Col>
    </Row>
  );
}

export default PlayerState;
