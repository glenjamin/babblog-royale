import { useCallback, useState } from "react";
import takeScreenshot from "./utils/take-screenshot";

interface ScreenGrabberProps {
  stepTo: (step: number) => void;
  stepForwards: () => void;
  stepMeForwards: () => void;
}

const ScreenGrabber = ({
  stepTo,
  stepForwards,
  stepMeForwards,
}: ScreenGrabberProps) => {
  const [startStep, setStartStep] = useState(0);
  const [endStep, setEndStep] = useState(3);
  const onClickRecord = useCallback(async () => {
    stepTo(startStep);
    for (let i = startStep; i <= endStep; i++) {
      const canvas = await takeScreenshot();
      console.log(canvas.toDataURL());
      stepForwards();
    }
  }, [startStep, endStep, stepTo, stepForwards]);
  return (
    <span>
      <input
        style={{ width: "30px" }}
        value={startStep}
        onChange={(e) => setStartStep(Number(e.target.value))}
      />
      <input
        style={{ width: "30px" }}
        value={endStep}
        onChange={(e) => setEndStep(Number(e.target.value))}
      />
      <button onClick={onClickRecord}>Record</button>
    </span>
  );
};

export default ScreenGrabber;
