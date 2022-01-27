import { useCallback, useState } from "react";
import takeScreenshot from "./utils/take-screenshot";
import GIF from "gif.js";
import { Button, Container, Form, InputGroup, Col, Row } from "react-bootstrap";

interface ScreenGrabberProps {
  max: number;
  stepTo: (step: number) => void;
  stepForwards: () => void;
  stepMeForwards: () => void;
}

const ScreenGrabber = ({
  max,
  stepTo,
  stepForwards,
  stepMeForwards,
}: ScreenGrabberProps) => {
  const [startStep, setStartStep] = useState("1");
  const [endStep, setEndStep] = useState("5");

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
    const start = Number(startStep) - 1;
    const end = Number(endStep) - 1;
    if (end < start) return;
    stepTo(start);
    const gif = new GIF({
      workers: 2,
      quality: 9,
      workerScript: `${process.env.PUBLIC_URL}/gif.worker.js`,
    });
    for (let i = start; i <= end; i++) {
      const canvas = await takeScreenshot();
      // console.log(canvas.toDataURL());;
      gif.addFrame(canvas);
      stepForwards();
    }
    gif.on("finished", (blob) => {
      console.log("🚀 / gif.on / blob", blob);
      window.open(URL.createObjectURL(blob));
    });
    gif.render();
  }, [startStep, endStep, stepTo, stepForwards]);
  return (
    <Form>
      <Row className="justify-content-sm-center">
        <Col sm="3">
          <InputGroup>
            <InputGroup.Text>Start</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="0"
              value={startStep}
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
              onChange={(e) => setEndStep(e.target.value)}
              onBlur={onBlurEnd}
            />
          </InputGroup>
        </Col>
        <Col sm="3">
          <Button onClick={onClickRecord}>Record GIF</Button>
        </Col>
      </Row>
    </Form>
  );
};

export default ScreenGrabber;
