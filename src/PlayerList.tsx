import Badge from "react-bootstrap/Badge";
import ListGroup from "react-bootstrap/ListGroup";
import { DEAD_SCORE } from "./constants";
import { LetterCell } from "./GameGrid";
import { Game, PlayerDetails, PlayerMetrics } from "./types";
import levelFromScore from "./utils/level-from-score";

interface PlayerListProps {
  players: PlayerDetails[];
  selectedPlayer: number | null;
  selectPlayer: (player: number | null) => void;
  currentStep: number;
  timeline: Game["timeline"];
}
function PlayerList({
  players,
  selectedPlayer,
  selectPlayer,
  currentStep,
  timeline,
}: PlayerListProps): JSX.Element {
  const { metrics } = timeline[currentStep];
  // TODO: Toggle sorting by kills / score / default?
  const sortedPlayers = [...players].sort((a, b) => {
    const diff = metrics[b.index].score - metrics[a.index].score;
    if (diff !== 0) return diff;
    return (b.killedStep ?? Infinity) - (a.killedStep ?? Infinity);
  });
  return (
    <ListGroup>
      {sortedPlayers.map((player) => (
        <PlayerListItem
          key={player.index}
          player={player}
          isDead={
            player.killedStep !== null && currentStep >= player.killedStep
          }
          isSelected={selectedPlayer === player.index}
          metrics={metrics[player.index]}
          selectPlayer={selectPlayer}
        />
      ))}
    </ListGroup>
  );
}

interface PlayerListItemProps {
  player: PlayerDetails;
  isDead: boolean;
  isSelected: boolean;
  metrics: PlayerMetrics;
  selectPlayer: (player: number | null) => void;
}
function PlayerListItem({
  player,
  isDead,
  isSelected,
  metrics,
  selectPlayer,
}: PlayerListItemProps): JSX.Element {
  const killIndicator = "⚔".repeat(metrics.kills);
  return (
    <ListGroup.Item
      className={`d-flex flex-row align-items-center p-1`}
      onClick={() => selectPlayer(isSelected ? null : player.index)}
      action
      active={isSelected}
    >
      <LetterCell letter="a" owner={isDead ? undefined : player} />
      <Metrics metrics={metrics} />
      <div className="ms-2">
        {player.name} {killIndicator}
      </div>
    </ListGroup.Item>
  );
}

const Metrics = ({ metrics: { score } }: { metrics: PlayerMetrics }) => {
  const dead = score === DEAD_SCORE;
  return (
    <div className="ms-3">
      <Badge bg={dead ? "light" : "dark"}>
        {dead ? "☠" : levelFromScore(score)}
      </Badge>
    </div>
  );
};

export default PlayerList;
