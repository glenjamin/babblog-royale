import { useMemo } from "react";

import Button from "react-bootstrap/Button";

// This feels like a hack, but the CSS to make it relative seemed even more
// complicated.
const approxGridHeight = 780;

interface WordsProps {
  timeline: Array<{
    player: {
      words: string[];
    };
  }>;
  currentStep: number;
  stepTo: (step: number) => void;
}

function Words({ timeline, currentStep, stepTo }: WordsProps): JSX.Element {
  const relevant = useMemo(
    () =>
      timeline
        .map(({ player }, i) => [i, player.words.sort(wordLength)] as const)
        .filter(([, words]) => words.length),
    [timeline]
  );
  return (
    <ul
      className="list-unstyled"
      style={{ overflowY: "auto", maxHeight: approxGridHeight }}
    >
      {relevant.map(([i, words]) => (
        <li
          key={i}
          value={i + 1}
          className={i === currentStep ? "bg-primary" : undefined}
          style={{ "--bs-bg-opacity": ".3" } as React.CSSProperties}
        >
          <Button
            className="p-0 align-baseline link-secondary"
            variant="link"
            onClick={() => stepTo(i)}
          >
            {i + 1}
          </Button>
          {words.map((word, i) => (
            <a
              key={i}
              target="wordnik"
              href={"https://www.wordnik.com/words/" + word}
              className="px-1 link-dark"
            >
              {word}
            </a>
          ))}
        </li>
      ))}
    </ul>
  );
}

function wordLength(a: string, b: string): number {
  return b.length - a.length;
}

export default Words;
