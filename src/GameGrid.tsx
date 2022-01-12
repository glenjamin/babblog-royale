import { Bonus, Letter, PlayerName, Game, PlayerDetails } from "./types";
import styles from "./Game.module.css";

interface GameGridProps {
  game: Game;
  step: number;
}
export default function GameGrid({ game, step }: GameGridProps) {
  const size = game.board.size;
  const range = Array(size).fill(0);
  const state = game.board.timeline[step];
  const playerByName = {} as Record<PlayerName, PlayerDetails>;
  game.players.forEach((p) => {
    playerByName[p.name] = p;
  });
  return (
    <table cellSpacing={0} cellPadding={0} className={styles.board}>
      <tbody>
        {range.map((_, row) => (
          <tr key={row}>
            {range
              .map((_, col) => {
                const index = row * size + col;
                const letter = state.letters[index];
                const owner = state.owners[index];
                let gas = "none";
                if(state.squaresWithGas.includes(index)) {
                  gas = "gas";
                } else if (state.squaresGoingToHaveGas.includes(index)) {
                  gas = "danger";
                }
                const gasOverlayElement = GasOverlay(gas);
                if (letter) {
                  return [gasOverlayElement, 
                    <LetterCell
                      letter={letter}
                      owner={owner && playerByName[owner]}
                    />];
                }
                const bonus = game.board.base[index];
                if (bonus) {
                  return [gasOverlayElement, <BonusCell bonus={bonus} />];
                }
                return [gasOverlayElement,<EmptyCell />];
              })
              .map((elements, col) => (
                <td key={col}>{elements}</td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function GasOverlay(type: string): JSX.Element | null {
  if(type === "gas") {
    return (
      <div
        className = {styles.gas}
      ></div>
    );
  }

  if(type === "danger") {
    return (
      <div
        className = {styles.danger}
      ></div>
    );
  }

  return null;
  
}
function EmptyCell() {
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
  15: "#d99", //darkred
} as const;
interface LetterProps {
  letter: Letter;
  owner: PlayerDetails | null;
}
export function LetterCell({ letter, owner }: LetterProps): JSX.Element {
  return (
    <div
      className={styles.letter}
      title={owner ? owner.name : undefined}
      style={owner ? { backgroundColor: ownerColours[owner.index] } : undefined}
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
function BonusCell({ bonus }: BonusProps): JSX.Element {
  return (
    <div className={styles[bonusTypeMap[bonus]]}>{bonusContentMap[bonus]}</div>
  );
}
