import { Bonus, Letter, Game, PlayerDetails, HotZone } from "./types";
import styles from "./Game.module.css";

interface GameGridProps {
  game: Game;
  step: number;
  selectedPlayer: number | null;
}
export default function GameGrid({
  game,
  step,
  selectedPlayer,
}: GameGridProps) {
  const size = game.board.size;
  const range = Array(size).fill(0);
  const state = game.timeline[step];
  return (
    <table cellSpacing={0} cellPadding={0} className={styles.board}>
      <tbody>
        {range.map((_, row) => (
          <tr key={row}>
            {range.map((_, col) => {
              const index = row * size + col;
              const { bombedIndexes } = state;
              const letter = state.letters[index];
              const owner = state.owners[index];
              const hot = state.hot[index];
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
                      isBombed={bombedIndexes.includes(index)}
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
  state: HotZone | void;
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
}
export function LetterCell({
  letter,
  owner,
  isSelected = false,
  isBombed = false,
}: LetterProps): JSX.Element {
  const colour = owner ? ownerColours[owner.index] : "";
  return (
    <div
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
const bonusContentMap = {
  "2x_word": "2x Wd",
  "3x_word": "3x Wd",
  "3x_letter": "3x Lt",
  "5x_letter": "5x Lt",
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
