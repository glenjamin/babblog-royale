import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";

import Navbar from "./Navbar";
import Importer from "./Importer";
import GameGrid from "./GameGrid";

import PlayerList from "./PlayerList";
import GameStepper from "./GameStepper";

import placeholderGame from "./placeholder-game";

import useAppReducer from "./reducer";

function App() {
  const [state, actions] = useAppReducer();
  const { games, gameIndex, gameStep, showImportDialog } = state;

  const game = games[gameIndex] || placeholderGame;
  const maxStep = game.board.timeline.length - 1;

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
        activeGameIndex={gameIndex}
      />
      <Container fluid>
        <Row>
          <Col>
            <GameGrid game={game} step={gameStep} />
          </Col>
          <Col>
            {/* Sidebar */}
            <Stack>
              <GameStepper
                step={gameStep}
                max={maxStep}
                stepTo={actions.chooseStep}
                stepBack={actions.stepBack}
                stepForwards={actions.stepForwards}
              />
              <PlayerList players={game.players} />
            </Stack>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
