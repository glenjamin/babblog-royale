import ListGroup from "react-bootstrap/ListGroup";
import { DEAD_SCORE } from "./constants";
import { LetterCell } from "./GameGrid";
import { Game, PlayerDetails, PlayerMetrics } from "./types";

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
  const sortedPlayers = [...players].sort(
    (a, b) => metrics[b.index].score - metrics[a.index].score
  );
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

const Metrics = ({ metrics: { score } }: { metrics: PlayerMetrics }) => (
  <div style={{ width: "40px", textAlign: "center" }}>
    {score === DEAD_SCORE ? "☠" : score}
  </div>
);

export default PlayerList;
