import Form from "react-bootstrap/Form";

import { Game } from "./types";

interface GamePickerProps {
  games: Game[];
  activeID: number;
  onPick: (activeID: number) => void;
}

function GamePicker({ games, activeID, onPick }: GamePickerProps): JSX.Element {
  return (
    <Form.Select
      autoFocus
      value={String(activeID)}
      onChange={(e) => onPick(Number(e.target.value))}
    >
      {games.map((game, index) => {
        const {
          id,
          you: { position, MMR, oldMMR },
        } = game;
        const delta = Math.round(MMR - oldMMR);
        return (
          <option key={index} value={String(game.id)}>
            Game #{id}: Position {position} to MMR {Math.round(MMR)} (
            {delta >= 0 && "+"}
            {delta})
          </option>
        );
      })}
    </Form.Select>
  );
}

export default GamePicker;
