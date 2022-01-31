import { useCallback, useState } from "react";
import takeScreenshot from "./utils/take-screenshot";
import GIF from "gif.js";
import { Button, Form, InputGroup, Col, Row } from "react-bootstrap";

interface ScreenGrabberProps {
  step: number;
  max: number;
  stepTo: (step: number) => void;
  stepForwards: () => void;
  stepMeForwards: () => void;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}
const ScreenGrabberControls = ({
  step,
  max,
  stepTo,
  stepForwards,
  stepMeForwards,
  isRecording,
  setIsRecording,
}: ScreenGrabberProps) => {
  const [startStepValue, setStartStepValue] = useState("1");
  const [numMovesValue, setNumMovesValue] = useState("1");
  const [myMovesOnly, setMyMovesOnly] = useState(false);

  const onBlurStart = useCallback(() => {
    const start = Number(startStepValue);
    const numMoves = Number(numMovesValue);
    if (isNaN(start)) {
      setStartStepValue("1");
      return;
    } else if (start > max) {
      setStartStepValue(String(max));
      setNumMovesValue("1");
      return;
    } else if (start + numMoves > max) {
      setNumMovesValue(String(max - start + 1));
    } else if (start < 1) {
      setStartStepValue("1");
      return;
    }
    setStartStepValue(String(Math.floor(start)));
  }, [startStepValue, numMovesValue, max]);

  const onBlurNumMoves = useCallback(() => {
    const start = Number(startStepValue);
    const numMoves = Number(numMovesValue);
    if (isNaN(numMoves)) {
      setNumMovesValue("1");
    } else if (numMoves < 1) {
      setNumMovesValue("1");
    } else if (start + numMoves > max) {
      // TODO: Make this work even when myMovesOnly is set to true
      setNumMovesValue(String(max - start + 1));
    } else {
      setNumMovesValue(String(Math.floor(numMoves)));
    }
  }, [startStepValue, numMovesValue, max]);

  const onClickRecord = useCallback(async () => {
    setIsRecording(true);
    const start = Number(startStepValue) - 1;
    const numMoves = Number(numMovesValue);
    stepTo(start);
    const gif = new GIF({
      workers: 2,
      quality: 9,
      workerScript: `${process.env.PUBLIC_URL}/gif.worker.js`,
    });
    // TODO: Get the number of steps when mine = true by checking the timeline
    for (let i = 0; i < numMoves; i++) {
      const canvas = await takeScreenshot();
      gif.addFrame(canvas);
      (myMovesOnly ? stepMeForwards : stepForwards)();
    }
    gif.on("finished", (blob) => {
      window.open(URL.createObjectURL(blob));
      setIsRecording(false);
    });
    gif.render();
  }, [
    startStepValue,
    numMovesValue,
    stepTo,
    stepForwards,
    stepMeForwards,
    myMovesOnly,
    setIsRecording,
  ]);
  return (
    <Form>
      <Row className="justify-content-sm-center align-items-center pt-2">
        <Col sm="3">
          <InputGroup>
            <InputGroup.Text>Start</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="0"
              value={startStepValue}
              disabled={isRecording}
              onChange={(e) => setStartStepValue(e.target.value)}
              onBlur={onBlurStart}
            />
          </InputGroup>
        </Col>
        <Col sm="3">
          <InputGroup>
            <InputGroup.Text># Moves</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="0"
              value={numMovesValue}
              disabled={isRecording}
              onChange={(e) => setNumMovesValue(e.target.value)}
              onBlur={onBlurNumMoves}
            />
          </InputGroup>
        </Col>
        <Col sm="auto">
          <Form.Group controlId="formBasicCheckbox">
            <Form.Check
              type="checkbox"
              value="mine"
              disabled={isRecording}
              onChange={(e) => setMyMovesOnly(e.target.checked)}
              label="Only my plays"
            />
          </Form.Group>
        </Col>
        <Col sm="auto">
          <Button onClick={onClickRecord} disabled={isRecording}>
            {isRecording ? "Recording..." : "Record GIF"}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

const ScreenGrabber = ({
  step,
  max,
  stepTo,
  stepForwards,
  stepMeForwards,
  isRecording,
  setIsRecording,
}: ScreenGrabberProps) => {
  return (
    <Row className="justify-content-sm-center pb-2 border-bottom">
      <Col sm="auto">
        <ScreenGrabberControls
          step={step}
          max={max}
          stepTo={stepTo}
          stepForwards={stepForwards}
          stepMeForwards={stepMeForwards}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </Col>
    </Row>
  );
};

export default ScreenGrabber;
