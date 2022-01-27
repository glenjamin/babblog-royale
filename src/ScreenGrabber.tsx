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
  const [startStep, setStartStep] = useState("1");
  const [endStep, setEndStep] = useState("1");
  const [mine, setMine] = useState(false);

  const onBlurStart = useCallback(() => {
    const start = Number(startStep);
    if (isNaN(start)) {
      setStartStep(endStep);
    } else if (start > Number(endStep)) {
      setEndStep(startStep);
    } else if (start < 0) {
      setStartStep("0");
    }
  }, [startStep, endStep]);

  const onBlurEnd = useCallback(() => {
    const end = Number(endStep);
    if (isNaN(end)) {
      setEndStep(startStep);
    } else if (end < Number(startStep)) {
      setStartStep(endStep);
    } else if (end > max) {
      setEndStep(String(max + 1));
    }
  }, [startStep, endStep, max]);

  const onClickRecord = useCallback(async () => {
    setIsRecording(true);
    const start = Number(startStep) - 1;
    const end = Number(endStep) - 1;
    stepTo(start);
    const gif = new GIF({
      workers: 2,
      quality: 9,
      workerScript: `${process.env.PUBLIC_URL}/gif.worker.js`,
    });
    const numSteps = mine ? 10 : end - start;
    for (let i = 0; i <= numSteps; i++) {
      const canvas = await takeScreenshot();
      gif.addFrame(canvas);
      (mine ? stepMeForwards : stepForwards)();
    }
    gif.on("finished", (blob) => {
      window.open(URL.createObjectURL(blob));
      setIsRecording(false);
    });
    gif.render();
  }, [
    startStep,
    endStep,
    stepTo,
    stepForwards,
    stepMeForwards,
    mine,
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
              value={startStep}
              disabled={isRecording}
              onChange={(e) => setStartStep(e.target.value)}
              onBlur={onBlurStart}
            />
          </InputGroup>
        </Col>
        <Col sm="3">
          <InputGroup>
            <InputGroup.Text>End</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="0"
              value={endStep}
              disabled={isRecording}
              onChange={(e) => setEndStep(e.target.value)}
              onBlur={onBlurEnd}
            />
          </InputGroup>
        </Col>
        <Col sm="auto">
          <Form.Group controlId="formBasicCheckbox">
            <Form.Check
              type="checkbox"
              value="mine"
              disabled={isRecording}
              onChange={(e) => setMine(e.target.checked)}
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
