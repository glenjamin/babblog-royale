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
      {games.map((game, index) => (
        <option key={index} value={String(index)}>
          Game #{game.id}: Position {game.you.position} to MRR{" "}
          {Math.round(game.you.MMR)}
        </option>
      ))}
    </Form.Select>
  );
}

export default GamePicker;
