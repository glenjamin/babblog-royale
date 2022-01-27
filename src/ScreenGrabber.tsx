import { useCallback, useState } from "react";
import takeScreenshot from "./utils/take-screenshot";
import GIF from "gif.js";

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
  const [startStep, setStartStep] = useState(0);
  const [endStep, setEndStep] = useState(3);
  const onSetStart = useCallback(
    (e) => {
      const step = Number(e.target.value);
      const newStart = Math.min(step, max - 1);
      setStartStep(newStart);
      setEndStep(Math.max(endStep, newStart + 1));
    },
    [endStep, setStartStep, setEndStep, max]
  );
  const onSetEnd = useCallback(
    (e) => {
      const step = Number(e.target.value);
      const newEnd = Math.max(step, 1);
      setEndStep(newEnd);
      setStartStep(Math.min(startStep, newEnd - 1));
    },
    [startStep, setStartStep, setEndStep]
  );
  const onClickRecord = useCallback(async () => {
    stepTo(startStep);
    const gif = new GIF({
      workers: 2,
      quality: 8,
      workerScript: `${process.env.PUBLIC_URL}/gif.worker.js`,
    });
    for (let i = startStep; i <= endStep; i++) {
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
    <span>
      <input
        style={{ width: "30px" }}
        value={startStep}
        onChange={onSetStart}
      />
      <input style={{ width: "30px" }} value={endStep} onChange={onSetEnd} />
      <button onClick={onClickRecord}>Record</button>
    </span>
  );
};

export default ScreenGrabber;
