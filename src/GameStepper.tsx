import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";

interface GameStepperProps {
  currentStep: number;
  max: number;
  stepMeBack: () => void;
  stepBack: () => void;
  stepTo: (step: number) => void;
  stepForwards: () => void;
  stepMeForwards: () => void;
}

function GameStepper(props: GameStepperProps): JSX.Element {
  const {
    currentStep,
    max,
    stepMeBack,
    stepBack,
    stepTo,
    stepForwards,
    stepMeForwards,
  } = props;
  return (
    <>
      <Row className="justify-content-sm-center">
        <Col sm="auto">
          <Pagination className="mb-1">
            <Pagination.First
              disabled={currentStep === 0}
              onClick={stepMeBack}
              title="My Last (up)"
            />
            <Pagination.Prev
              disabled={currentStep === 0}
              onClick={stepBack}
              title="Back (left)"
            />
            <Pagination.Item disabled>
              {/* UI is 1-indexed, but internals are 0-indexed */}
              Step {currentStep + 1} / {max + 1}
            </Pagination.Item>
            <Pagination.Next
              disabled={currentStep === max}
              onClick={stepForwards}
              title="Next (right)"
            />
            <Pagination.Last
              disabled={currentStep === max}
              onClick={stepMeForwards}
              title="My Next (down)"
            />
          </Pagination>
        </Col>
      </Row>
      <Row className="justify-content-sm-center">
        <Form.Range
          min="0"
          max={max}
          value={currentStep}
          onChange={(e) => stepTo(Number(e.target.value))}
          style={{ width: "auto" }}
        />
      </Row>
    </>
  );
}

export default GameStepper;
