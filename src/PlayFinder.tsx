import { Game } from "./types";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Stack from "react-bootstrap/Stack";
import ProgressBar from "react-bootstrap/ProgressBar";
import { findCurrentlyPlayedWord, Play, playsScore } from "./Play";
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
  const [{ stopFunction, tryCount, cache, plays, noResults }, setState] =
    useState<{
      stopFunction?: () => void;
      tryCount?: number;
      cache?: CachedPlay;
      plays?: Array<Play[]>;
      noResults?: boolean;
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
    let running = [true];
    const stop = () => {
      running[0] = false;
    };
    let plays: Array<Play[]> = [];

    setState({ stopFunction: stop, tryCount: 0, cache: undefined, plays });

    const currentPlay =
      cache !== undefined &&
      cache.gameUUID === game.posInFile &&
      cache.step === currentStep
        ? cache.play
        : await findCurrentlyPlayedWord(game, currentStep);

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
    const updateState = (newPlays = false) => {
      if (!newPlays && (!running || tries[0] % 20 !== 0)) return;

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
      canContinue: running,
      callback: updateState,
      maxNumberOfWords: MAX_TRIES,
    };
    const playGenerator: AsyncGenerator<Play[]> =
      type === "Kills"
        ? currentPlay.findKills(props)
        : currentPlay.findRackClears(props);

    while (running[0]) {
      const result = await playGenerator.next();
      if (result.done) {
        break;
      }
      plays.push(result.value);
      plays.sort((a, b) => playsScore(b) - playsScore(a));
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
      noResults: plays.length === 0,
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
        {!findTaskRunning && (
          <ProgressBar now={100} style={{ minHeight: "1rem" }} />
        )}
        {findTaskRunning && (
          <ProgressBar
            animated
            label={"Searching..."}
            now={((tryCount ?? 0) / MAX_TRIES) * 100}
            style={{ minHeight: "1rem" }}
          />
        )}
        <ul className="list-unstyled" style={{ overflowY: "auto" }}>
          {plays?.map((play, i) => (
            <li key={i}>{`${play
              .map((p, j) => p.word.toUpperCase())
              .join(" -> ")} (${playsScore(play)} points)`}</li>
          ))}
          {noResults && <li>No results</li>}
        </ul>
      </Stack>
    </>
  );
}

export default PlayFinder;
