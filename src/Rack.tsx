import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { Letter } from "./types";
import { EmptyCell, LetterCell } from "./GameGrid";

interface RackProps {
  letters: Array<Letter>;
  max: number;
}
function Rack({ letters, max }: RackProps): JSX.Element {
  return (
    <Row className="justify-content-sm-center">
      <Col className="pb-3 d-flex" sm="auto">
        {letters.map((letter, i) => (
          <LetterCell key={i} letter={letter} />
        ))}
        {new Array(max - letters.length).fill(0).map((_, i) => (
          <EmptyCell />
        ))}
      </Col>
    </Row>
  );
}

export default Rack;
