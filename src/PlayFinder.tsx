import { Game } from "./types";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Stack from "react-bootstrap/Stack";
import ProgressBar from "react-bootstrap/ProgressBar";
import {
  findCurrentlyPlayedWord,
  FindPlaysProps,
  Play,
  playsScore,
} from "./Play";
import { approxTabContentMaxHeight } from "./constants";
import { Waiter } from "./utils/utils";

interface PlayFinderProps {
  game: Game;
  currentStep: number;
}

interface CachedPlay {
  gameUUID: string;
  step: number;
  play: Play;
  args: FindPlaysProps;
}

type FindType = "Kills" | "RackClears" | "HighScores";

function PlayFinder({ game, currentStep }: PlayFinderProps) {
  const MAX_TRIES = 2000;
  const [
    { stopFunction, tryCount, maxTries, cache, plays, noResults },
    setState,
  ] = useState<{
    stopFunction?: () => void;
    tryCount?: number;
    maxTries?: number;
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
    setState({
      stopFunction: () => {},
    });
    let running = [true];
    const stop = () => {
      running[0] = false;
    };
    const waiter = new Waiter();
    let plays: Array<Play[]> = [];

    setState({ stopFunction: stop, tryCount: 0, cache: undefined, plays });

    const cacheIsValid =
      cache !== undefined &&
      cache.gameUUID === game.posInFile &&
      cache.step === currentStep;

    const currentPlay = cacheIsValid
      ? cache!.play
      : await findCurrentlyPlayedWord(game, currentStep);

    const tries = [0];
    const updateState = (newPlays = false) => {
      if (!newPlays && (!running || tries[0] % 20 !== 0)) return;

      setState({
        stopFunction: stop,
        tryCount: tries[0],
        maxTries: findArgs.maxNumberOfWords,
        cache: {
          gameUUID: game.posInFile,
          step: currentStep,
          play: currentPlay,
          args: findArgs,
        },
        plays,
      });
    };
    let findArgs: FindPlaysProps;

    if (cacheIsValid) {
      findArgs = cache!.args;
      findArgs.maxNumberOfWords! += 1000;
      if (findArgs.depthRemaining === undefined) findArgs.depthRemaining = 3;
      findArgs.depthRemaining += 1;
      if (findArgs.tryRacksUntil === undefined) findArgs.tryRacksUntil = 3;
      findArgs.tryRacksUntil += 1;
    } else {
      findArgs = {
        numberOfWordsSearched: tries,
        canContinue: running,
        callback: updateState,
        maxNumberOfWords: MAX_TRIES,
        isAnswer: (_) => false, // will be replaced by the correct function below
      };
    }

    // use up-to-date callback
    findArgs.callback = updateState;

    if (type === "Kills") {
      findArgs.isAnswer = (p) => p.killedCount > 0;
      findArgs.isValid = (p) => p.checkIfCanKill();
    }
    if (type === "RackClears") {
      findArgs.isAnswer = (p) => p.playerRackAfter.length === 0;
      findArgs.isValid = (p) => p.playerRackAfter.length > 0;
    }
    if (type === "HighScores") {
      findArgs.isAnswer = (p) => p.score > 20;
      findArgs.isValid = (p) => true;
    }

    setState({
      stopFunction: stop,
      tryCount: 0,
      cache: {
        gameUUID: game.posInFile,
        step: currentStep,
        play: currentPlay,
        args: findArgs,
      },
    });

    const playGenerator = currentPlay.findPlays(findArgs);

    while (running[0]) {
      const result = await playGenerator.next();
      if (result.done) {
        break;
      }
      plays.push(result.value);
      plays.sort((a, b) => playsScore(b) - playsScore(a));
      updateState(true);
    }

    await waiter.wait(500);

    setState({
      cache: {
        gameUUID: game.posInFile,
        step: currentStep,
        play: currentPlay,
        args: findArgs,
      },
      plays,
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
          <Button
            disabled={findTaskRunning}
            onClick={() => start("HighScores")}
          >
            Find High Scoring Plays
          </Button>
          <Button disabled={!findTaskRunning} onClick={() => stop()}>
            Stop
          </Button>
        </Stack>
        <ProgressBar
          animated={findTaskRunning}
          label={findTaskRunning && "Searching..."}
          now={
            findTaskRunning
              ? ((tryCount ?? 0) / (maxTries ?? MAX_TRIES)) * 100
              : 100
          }
          style={{ minHeight: "1rem" }}
        />
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
