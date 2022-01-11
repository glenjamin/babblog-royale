import ListGroup from "react-bootstrap/ListGroup";
import { LetterCell } from "./GameGrid";
import { PlayerDetails } from "./types";

interface PlayerListProps {
  players: PlayerDetails[];
}
function PlayerList({ players }: PlayerListProps): JSX.Element {
  return (
    <ListGroup>
      {players.map((player, i) => (
        <ListGroup.Item
          key={i}
          className="d-flex flex-row align-items-center p-1"
        >
          <LetterCell letter="a" owner={player} />
          <div className="ms-2">{player.name}</div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}

export default PlayerList;
