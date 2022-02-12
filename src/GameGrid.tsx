import { Bonus, Letter, Game, PlayerDetails } from "./types";
import styles from "./Game.module.css";

const CELL_SIZE = 25;

interface GameGridProps {
  game: Game;
  currentStep: number;
  selectedPlayer: number | null;
  selectPlayer: (player: number | null) => void;
}
export default function GameGrid({
  game,
  currentStep,
  selectedPlayer,
  selectPlayer,
}: GameGridProps) {
  const size = game.board.size;
  const range = Array(size).fill(0);
  const state = game.timeline[currentStep];

  const boxSize = (CELL_SIZE + 2) * size;

  const cells: JSX.Element[] = [];
  const importantCells: JSX.Element[] = [];

  range.forEach((_, row) =>
    range.forEach((_, col) => {
      const x = col * (CELL_SIZE + 2);
      const y = row * (CELL_SIZE + 2);

      const index = row * size + col;
      const letter = state.letters[index];
      const owner = state.owners[index];
      // const hot = state.hot[index];
      const bombed = state.bombed[index];
      const bonus = game.board.base[index];

      // TODO: hotzone

      const cell = letter ? (
        <LetterSVG
          x={x}
          y={y}
          letter={letter}
          owner={owner === undefined ? owner : game.players[owner]}
          isSelected={selectedPlayer === owner}
          isBombed={bombed}
          selectPlayer={selectPlayer}
        />
      ) : bonus ? (
        <BonusSVG x={x} y={y} bonus={bonus} />
      ) : (
        <EmptySVG x={x} y={y} />
      );

      // Place cells which need to draw over their neighbors at the end
      if (owner !== undefined) {
        importantCells.push(cell);
      } else {
        cells.push(cell);
      }
    })
  );

  return (
    <svg className={styles.board} width={boxSize} height={boxSize}>
      {cells}
      {importantCells}
    </svg>
  );
}

// interface GasOverlayProps {
//   state: HotZone | undefined;
// }
// function GasOverlay({ state }: GasOverlayProps): JSX.Element | null {
//   return state ? <div className={styles[state]}></div> : null;
// }

interface Coordinates {
  x: number;
  y: number;
}
interface CellProps {
  className: string;
  background?: string;
  content?: string;
}

function CellSVG({
  x,
  y,
  className,
  background,
  content,
}: CellProps & Coordinates): JSX.Element {
  const style: any = background ? { "--cell-bg": background } : undefined;
  const boundingSize = CELL_SIZE + 2;
  return (
    <svg
      x={x}
      y={y}
      width={boundingSize}
      height={boundingSize}
      className={className}
      style={style}
    >
      <rect x={1} y={1} width={CELL_SIZE} height={CELL_SIZE} />
      {content && (
        <text x={boundingSize / 2} y={2 + boundingSize / 2}>
          {content}
        </text>
      )}
    </svg>
  );
}

export function EmptySVG({ x, y }: Coordinates) {
  return <CellSVG x={x} y={y} className={styles.emptySVG} />;
}

export function EmptyCell() {
  return <div className={styles.empty} />;
}

const ownerColours = {
  0: "#68D",
  1: "#c4e",
  2: "#862",
  3: "#4c1",
  4: "#596",
  5: "#f55",
  6: "#170",
  7: "#d01",
  8: "#099",
  9: "#d42",
  10: "#a26",
  11: "#dc1",
  12: "#773",
  13: "#11a",
  14: "#561",
  15: "#d99",
} as const;
interface LetterProps {
  letter: Letter;
  owner?: PlayerDetails;
  isSelected?: boolean;
  isBombed?: boolean;
  selectPlayer?: (player: number | null) => void;
}

export function LetterSVG({
  x,
  y,
  letter,
  owner,
  isSelected = false,
}: LetterProps & Coordinates): JSX.Element {
  const classNames = [styles.letterSVG];
  if (isSelected) {
    classNames.push(styles.highlight);
  }
  return (
    <CellSVG
      x={x}
      y={y}
      className={classNames.join(" ")}
      background={owner && ownerColours[owner.index]}
      content={letter.toUpperCase()}
    />
  );
}

export function LetterCell({
  letter,
  owner,
  isSelected = false,
  isBombed = false,
  selectPlayer,
}: LetterProps): JSX.Element {
  const colour = owner ? ownerColours[owner.index] : "";
  return (
    <div
      onClick={
        selectPlayer
          ? () => selectPlayer(!isSelected && owner ? owner.index : null)
          : undefined
      }
      className={`${styles.letter} ${isBombed && styles.explodingTile}`}
      title={owner ? owner.name : undefined}
      style={
        owner
          ? {
              backgroundColor: colour,
              filter: isSelected ? `drop-shadow(0 0 8px ${colour})` : "",
            }
          : undefined
      }
    >
      {letter.toUpperCase()}
    </div>
  );
}
const bonusTypeMap = {
  "2x_word": "bonusWord",
  "3x_word": "bonusWord",
  "3x_letter": "bonusLetter",
  "5x_letter": "bonusLetter",
  bomb: "bonusItem",
  medkit: "bonusItem",
  reroll_all: "bonusItem",
  letter_s: "bonusItem",
} as const;
interface ContentProps {
  multiplier: Number;
  bonusType: string;
}
function BonusCellContent({ multiplier, bonusType }: ContentProps) {
  return (
    <>
      {multiplier.toString()}x<br />
      {bonusType}
    </>
  );
}
const bonusContentMap = {
  "2x_word": <BonusCellContent multiplier={2} bonusType={"Wd"} />,
  "3x_word": <BonusCellContent multiplier={3} bonusType={"Wd"} />,
  "3x_letter": <BonusCellContent multiplier={3} bonusType={"Lt"} />,
  "5x_letter": <BonusCellContent multiplier={5} bonusType={"Lt"} />,
  bomb: "💣",
  medkit: "➕",
  reroll_all: "♺",
  letter_s: "🅂",
} as const;
interface BonusProps {
  bonus: Bonus;
}

export function BonusSVG({
  x,
  y,
  bonus,
}: BonusProps & Coordinates): JSX.Element {
  return (
    <CellSVG
      x={x}
      y={y}
      className={styles.bonusSVG}
      content={String(bonusContentMap[bonus])}
    />
  );
}

export function BonusCell({ bonus }: BonusProps): JSX.Element {
  return (
    <div className={styles[bonusTypeMap[bonus]]}>{bonusContentMap[bonus]}</div>
  );
}
