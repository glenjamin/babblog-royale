import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";
import ScreenGrabber from "./ScreenGrabber";

interface GameStepperProps {
  step: number;
  max: number;
  stepMeBack: () => void;
  stepBack: () => void;
  stepTo: (step: number) => void;
  stepForwards: () => void;
  stepMeForwards: () => void;
}
function GameStepper(props: GameStepperProps): JSX.Element {
  const {
    step,
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
          <Pagination>
            <Pagination.First
              disabled={step === 0}
              onClick={stepMeBack}
              title="My Last (up)"
            />
            <Pagination.Prev
              disabled={step === 0}
              onClick={stepBack}
              title="Back (left)"
            />
            <Pagination.Item disabled>
              {/* UI is 1-indexed, but internals are 0-indexed */}
              Step {step + 1} / {max + 1}
            </Pagination.Item>
            <Pagination.Next
              disabled={step === max}
              onClick={stepForwards}
              title="Next (right)"
            />
            <Pagination.Last
              disabled={step === max}
              onClick={stepMeForwards}
              title="My Next (down)"
            />
          </Pagination>
          <ScreenGrabber
            max={max}
            stepTo={stepTo}
            stepForwards={stepForwards}
            stepMeForwards={stepMeForwards}
          />
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
