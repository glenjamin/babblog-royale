import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";

import Navbar from "./Navbar";
import Importer from "./Importer";
import Hotkeys from "./Hotkeys";
import GameGrid from "./GameGrid";
import GameStepper from "./GameStepper";
import PlayerState from "./PlayerState";
import PlayerList from "./PlayerList";

import useAppReducer from "./reducer";

function App() {
  const [state, actions] = useAppReducer();
  const {
    games,
    game,
    gameStep,
    selectedPlayer,
    showImportDialog,
    showHotkeyHelp,
  } = state;

  return (
    <>
      <Importer
        show={showImportDialog}
        onImport={actions.importGames}
        onClose={actions.cancelImport}
      />
      <Navbar
        showImport={actions.showImport}
        chooseGame={actions.chooseGame}
        games={games}
        activeGameID={game.id}
      />
      <Hotkeys showHelp={showHotkeyHelp} {...actions} />
      <Container fluid>
        <Row>
          <Col>
            <GameGrid
              game={game}
              step={gameStep}
              selectedPlayer={selectedPlayer}
            />
          </Col>
          <Col>
            {/* Sidebar */}
            <Stack>
              <GameStepper
                step={gameStep}
                max={game.timeline.length - 1}
                stepTo={actions.chooseStep}
                stepBack={actions.stepBack}
                stepForwards={actions.stepForwards}
              />
              <PlayerState {...game.timeline[gameStep].player} />
              <PlayerList
                players={game.players}
                selectedPlayer={selectedPlayer}
                selectPlayer={actions.selectPlayer}
              />
            </Stack>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
