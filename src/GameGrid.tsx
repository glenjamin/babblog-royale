import { Bonus, Letter, Game, PlayerDetails, HotZone } from "./types";
import styles from "./Game.module.css";
import { useEffect, useRef } from "react";

interface GameGridProps {
  game: Game;
  currentStep: number;
  selectedPlayer: number | null;
  selectPlayer: (player: number | null) => void;
}

const CELL_SIZE = 25;

export default function GameGrid({
  game,
  currentStep,
  selectedPlayer,
  selectPlayer,
}: GameGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gridSize = (CELL_SIZE + 2) * game.board.size;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio;
    canvas.style.width = gridSize + "px";
    canvas.style.height = gridSize + "px";
    canvas.width = gridSize * ratio;
    canvas.height = gridSize * ratio;
    ctx.scale(ratio, ratio);
  }, [gridSize]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    drawGame(ctx, game, currentStep);
  }, [game, currentStep]);

  return <canvas className={styles.board} ref={canvasRef} />;
}

let hotZonePatternCache = {} as Record<HotZone, HTMLCanvasElement | undefined>;
function hotZonePattern(type: HotZone): HTMLCanvasElement {
  if (!hotZonePatternCache[type]) {
    const size = 12;

    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;

    const x0 = size * 1.5;
    const x1 = size * -0.5;
    const y0 = size * -0.5;
    const y1 = size * 1.5;
    const offset = 12;

    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = type === "hot" ? "#c00" : "#999";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.moveTo(x0 - offset, y0);
    ctx.lineTo(x1 - offset, y1);
    ctx.moveTo(x0 + offset, y0);
    ctx.lineTo(x1 + offset, y1);
    ctx.stroke();

    hotZonePatternCache[type] = c;
  }
  return hotZonePatternCache[type]!;
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  game: Game,
  currentStep: number
) {
  const size = game.board.size;
  const gridSize = (CELL_SIZE + 2) * game.board.size;

  const step = game.timeline[currentStep];

  ctx.clearRect(0, 0, gridSize, gridSize);

  const hotZone = ctx.createPattern(hotZonePattern("hot"), "repeat")!;
  const warmZone = ctx.createPattern(hotZonePattern("warm"), "repeat")!;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const x = col * (CELL_SIZE + 2);
      const y = row * (CELL_SIZE + 2);

      const index = row * size + col;
      const letter = step.letters[index];
      const owner = step.owners[index];
      const hot = step.hot[index];
      const bombed = step.bombed[index];
      const bonus = game.board.base[index];
      // TODO: highlight selected

      let background: string = "";

      if (owner !== undefined) {
        background = ownerColours[owner];
      } else if (letter) {
        background = "#777";
      } else {
        background = "#eee";
      }

      ctx.fillStyle = background;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      if (bombed) {
        ctx.strokeStyle = "red";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }

      if (letter) {
        const upper = letter.toUpperCase();
        ctx.font = "16px Verdana, Geneva, Tahoma, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#eee";
        ctx.fillText(upper, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 2);
      } else if (bonus) {
        const type = bonusTypeMap[bonus];
        if (type === "bonusItem") {
          ctx.font = "16px Arial";
          ctx.textAlign = "left";
          ctx.textBaseline = "bottom";
          ctx.fillStyle = "#000";
          // TODO: use icons instead of emoji
          const char = String(bonusContentMap[bonus]);
          const measure = ctx.measureText(char);
          ctx.fillText(
            char,
            x + CELL_SIZE / 2 - measure.width / 2 + 1,
            y +
              CELL_SIZE / 2 +
              (measure.actualBoundingBoxAscent +
                measure.actualBoundingBoxDescent) /
                2
          );
        } else {
          ctx.font = "10px Verdana, Geneva, Tahoma, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = type === "bonusLetter" ? "#393" : "#77d";

          const line1 = bonus.substring(0, 2);
          const line2 = type === "bonusLetter" ? "Lt" : "Wd";

          ctx.fillText(line1, x + CELL_SIZE / 2, y + 4);
          ctx.fillText(line2, x + CELL_SIZE / 2, y + 14);
        }
      }

      if (hot) {
        ctx.fillStyle = hot === "hot" ? hotZone : warmZone;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

export function TableGameGrid({
  game,
  currentStep,
  selectedPlayer,
  selectPlayer,
}: GameGridProps) {
  const size = game.board.size;
  const range = Array(size).fill(0);
  const state = game.timeline[currentStep];
  return (
    <table cellSpacing={0} cellPadding={0} className={styles.board}>
      <tbody>
        {range.map((_, row) => (
          <tr key={row}>
            {range.map((_, col) => {
              const index = row * size + col;
              const letter = state.letters[index];
              const owner = state.owners[index];
              const hot = state.hot[index];
              const bombed = state.bombed[index];
              const bonus = game.board.base[index];

              return (
                <td key={col}>
                  <GasOverlay state={hot} />
                  {letter ? (
                    <LetterCell
                      letter={letter}
                      owner={
                        owner !== undefined ? game.players[owner] : undefined
                      }
                      isSelected={selectedPlayer === owner}
                      isBombed={bombed}
                      selectPlayer={selectPlayer}
                    />
                  ) : bonus ? (
                    <BonusCell bonus={bonus} />
                  ) : (
                    <EmptyCell />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface GasOverlayProps {
  state: HotZone | undefined;
}
function GasOverlay({ state }: GasOverlayProps): JSX.Element | null {
  return state ? <div className={styles[state]}></div> : null;
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
export function BonusCell({ bonus }: BonusProps): JSX.Element {
  return (
    <div className={styles[bonusTypeMap[bonus]]}>{bonusContentMap[bonus]}</div>
  );
}
