import Form from "react-bootstrap/Form";
import { Game } from "./types";

interface GamePickerProps {
  games: Game[];
  index: number;
  onPick: (index: number) => void;
}

function GamePicker({ games, index, onPick }: GamePickerProps): JSX.Element {
  return (
    <Form.Select
      autoFocus
      value={String(index)}
      onChange={(e) => onPick(Number(e.target.value))}
    >
      <option value="-1">Select a game</option>
      {games.map((game, index) => {
        const {
          id,
          you: { position, MMR, oldMMR },
        } = game;
        const delta = Math.round(MMR - oldMMR);
        return (
          <option key={index} value={String(index)}>
            Game #{id}: Position {position} to MRR {Math.round(MMR)} (
            {delta >= 0 && "+"}
            {delta})
          </option>
        );
      })}
    </Form.Select>
  );
}

export default GamePicker;
