import { Game } from "./types";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Stack from "react-bootstrap/Stack";
import ProgressBar from "react-bootstrap/ProgressBar";
import { findCurrentlyPlayedWord, Play } from "./Play";
import { approxTabContentMaxHeight } from "./constants";

interface PlayFinderProps {
  game: Game;
  currentStep: number;
}

interface CachedPlay {
  gameUUID: string;
  step: number;
  play: Play;
}

type FindType = "Kills" | "RackClears";

function PlayFinder({ game, currentStep }: PlayFinderProps) {
  const MAX_TRIES = 2000;
  const [{ stopFunction, tryCount, cache, plays }, setState] = useState<{
    stopFunction?: () => void;
    tryCount?: number;
    cache?: CachedPlay;
    plays?: Array<Play[]>;
  }>({});
  const findTaskRunning = stopFunction !== undefined;

  if (findTaskRunning) {
    if (cache !== undefined)
      if (cache.gameUUID !== game.posInFile || cache.step !== currentStep) {
        stopFunction();
        setState({});
      }
  }

  async function start(type: FindType) {
    console.log(`PlayFinder start ${type}`);
    let running = true;
    const stop = () => {
      running = false;
      console.log("stopping");
    };
    let plays: Array<Play[]> = [];

    setState({ stopFunction: stop, tryCount: 0, cache: undefined, plays });

    const currentPlay =
      cache !== undefined && cache.gameUUID === game.posInFile && cache.step === currentStep
        ? cache.play
        : await findCurrentlyPlayedWord(game, currentStep);



    console.log(`PlayFinder start ${type} currentPlay:}`, currentPlay);

    setState({
      stopFunction: stop,
      tryCount: 0,
      cache: {
        gameUUID: game.posInFile,
        step: currentStep,
        play: currentPlay,
      },
    });

    const tries = [0];
    const updateState = (newPlays=false) => {
      if (!running) return;
      if (!newPlays && tries[0] % 50 !== 0) return;


      setState({
        stopFunction: stop,
        tryCount: tries[0],
        cache: {
          gameUUID: game.posInFile,
          step: currentStep,
          play: currentPlay,
        },
        plays: plays,
      });
    };
    const props = {
      numberOfWordsSearched: tries,
      canContinue: [running],
      callback: updateState,
      maxNumberOfWords: MAX_TRIES,
    };
    const playGenerator: AsyncGenerator<Play[]> =
      type === "Kills"
        ? currentPlay.findKills(props)
        : currentPlay.findRackClears(props);

    while (running) {
      const result = await playGenerator.next();
      if (result.done) {
        break;
      }
      plays.push(result.value);
      console.log(result.value);
      updateState(true);
    }

    setState({
      stopFunction: undefined,
      tryCount: undefined,
      cache: {
        gameUUID: game.posInFile,
        step: currentStep,
        play: currentPlay,
      },
      plays: plays,
    });
  }

  async function stop() {
    stopFunction?.();
  }

  return (
    <>
      <Stack gap={1} style={{ maxHeight: approxTabContentMaxHeight }}>
        <Stack
          direction="horizontal"
          gap={3}
          className="justify-content-sm-center"
        >
          <Button
            disabled={findTaskRunning}
            onClick={() => start("RackClears")}
          >
            Find Rack Clears
          </Button>
          <Button disabled={findTaskRunning} onClick={() => start("Kills")}>
            Find Kills
          </Button>
          <Button disabled={!findTaskRunning} onClick={() => stop()}>
            Stop
          </Button>
        </Stack>
        {!findTaskRunning && <ProgressBar now={100} />}
        {findTaskRunning && (
          <ProgressBar
            animated
            label={"Searching..."}
            now={((tryCount ?? 0) / MAX_TRIES) * 100}
          />
        )}
      </Stack>
    </>
  );
}

export default PlayFinder;
