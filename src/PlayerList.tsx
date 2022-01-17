import ListGroup from "react-bootstrap/ListGroup";
import { LetterCell } from "./GameGrid";
import { PlayerDetails } from "./types";

interface PlayerListProps {
  players: PlayerDetails[];
  selectedPlayer: number | null;
  selectPlayer: (player: number | null) => void;
  currentStep: number;
}
function PlayerList({
  players,
  selectedPlayer,
  selectPlayer,
  currentStep,
}: PlayerListProps): JSX.Element {
  return (
    <ListGroup>
      {players.map((player, i) => (
        <PlayerListItem
          key={i}
          player={player}
          isDead={
            player.killedStep !== null && currentStep >= player.killedStep
          }
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
  isDead: boolean;
  isSelected: boolean;
  selectPlayer: (player: number | null) => void;
}
function PlayerListItem({
  player,
  index,
  isDead,
  isSelected,
  selectPlayer,
}: PlayerListItemProps): JSX.Element {
  return (
    <ListGroup.Item
      className={`d-flex flex-row align-items-center p-1`}
      onClick={() => selectPlayer(isSelected ? null : index)}
      action
      active={isSelected}
    >
      <LetterCell letter="a" owner={isDead ? undefined : player} />
      <div className="ms-2">
        {player.name} {isDead && "☠"}
      </div>
    </ListGroup.Item>
  );
}

export default PlayerList;
