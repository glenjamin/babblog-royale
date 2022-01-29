import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";

import { Game, GameStep } from "./types";
import { BonusCell, EmptyCell, LetterCell } from "./GameGrid";

type PlayerStateProps = GameStep["player"] & Pick<Game, "levels">;

function PlayerState({
  levels,
  letters,
  rackSize,
  items,
  itemSlots,
  hp,
  money,
  points,
}: PlayerStateProps): JSX.Element {
  const level = levels.findIndex((n) => n > points);
  return (
    <>
      <Row className="justify-content-sm-center my-3">
        <Col className="d-flex" sm="auto">
          {letters.map((letter, i) => (
            <LetterCell key={i} letter={letter} selectPlayer={() => {return null}}/>
          ))}
          {new Array(rackSize - letters.length).fill(0).map((_, i) => (
            <EmptyCell key={i} />
          ))}
          <div className="ms-3">
            <Badge bg="dark">{level}</Badge>
          </div>
        </Col>
      </Row>
      <Row className="justify-content-sm-center mb-3">
        <Col className="d-flex" sm="auto">
          {items.map((item, i) => (
            <BonusCell key={i} bonus={item} />
          ))}
          {new Array(itemSlots - items.length).fill(0).map((_, i) => (
            <EmptyCell key={i} />
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
          <div className="ms-3">${money}</div>
        </Col>
      </Row>
    </>
  );
}

export default PlayerState;
