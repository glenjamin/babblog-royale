import ListGroup from "react-bootstrap/ListGroup";
import { LetterCell } from "./GameGrid";
import { PlayerDetails } from "./types";

interface PlayerListProps {
  players: PlayerDetails[];
  selectedPlayer: number | null;
  selectPlayer: (player: number | null) => void;
}
function PlayerList({
  players,
  selectedPlayer,
  selectPlayer,
}: PlayerListProps): JSX.Element {
  return (
    <ListGroup>
      {players.map((player, i) => (
        <PlayerListItem
          player={player}
          isSelected={selectedPlayer === i}
          index={i}
          selectPlayer={selectPlayer}
        />
      ))}
    </ListGroup>
  );
}

interface PlayerListItemProps {
  player: PlayerDetails;
  index: number;
  isSelected: boolean;
  selectPlayer: (player: number | null) => void;
}
function PlayerListItem({
  player,
  index,
  isSelected,
  selectPlayer,
}: PlayerListItemProps): JSX.Element {
  return (
    <ListGroup.Item
      key={player.index}
      className={`d-flex flex-row align-items-center p-1`}
      onClick={() => selectPlayer(isSelected ? null : index)}
      action
      active={isSelected}
    >
      <LetterCell letter="a" owner={player} />
      <div className="ms-2">{player.name}</div>
    </ListGroup.Item>
  );
}

export default PlayerList;
