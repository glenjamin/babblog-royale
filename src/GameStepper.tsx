import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";

interface GameStepperProps {
  step: number;
  max: number;
  stepTo: (step: number) => void;
  stepBack: () => void;
  stepForwards: () => void;
}
function GameStepper(props: GameStepperProps): JSX.Element {
  const { step, max, stepTo, stepBack, stepForwards } = props;
  return (
    <>
      <Row className="justify-content-sm-center">
        <Col sm="auto">
          <Pagination>
            <Pagination.Prev disabled={step === 0} onClick={stepBack}>
              Back
            </Pagination.Prev>
            <Pagination.Item disabled>
              {/* UI is 1-indexed, but internals are 0-indexed */}
              Step {step + 1} / {max + 1}
            </Pagination.Item>
            <Pagination.Next disabled={step === max} onClick={stepForwards}>
              Forwards
            </Pagination.Next>
          </Pagination>
        </Col>
      </Row>
      <Row className="justify-content-sm-center">
        <Col sm="auto">
          <Form.Range
            min="0"
            max={max}
            value={step}
            onChange={(e) => stepTo(Number(e.target.value))}
          />
        </Col>
      </Row>
    </>
  );
}

export default GameStepper;
