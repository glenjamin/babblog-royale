import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";

import Navbar from "./Navbar";
import Importer from "./Importer";
import Hotkeys from "./Hotkeys";
import GameGrid from "./GameGrid";
import GameStepper from "./GameStepper";
import PlayerState from "./PlayerState";
import PlayerList from "./PlayerList";
import Words from "./Words";

import useAppReducer from "./reducer";
import { findCurrentlyPlayedWord, Play, playsScore } from "./Play";
import Button from "react-bootstrap/esm/Button";

function App() {
  const [state, actions] = useAppReducer();
  const {
    games,
    game,
    currentStep,
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
              currentStep={currentStep}
              selectedPlayer={selectedPlayer}
              selectPlayer={actions.selectPlayer}
            />
          </Col>
          {/* Sidebar */}
          <Col className="border-start ps-0">
            <Tabs defaultActiveKey="steps" className="mt-3 ps-2">
              <Tab eventKey="steps" title="Steps">
                <Stack className="p-2">
                  <GameStepper
                    currentStep={currentStep}
                    max={game.timeline.length - 1}
                    stepMeBack={actions.stepMeBack}
                    stepBack={actions.stepBack}
                    stepForwards={actions.stepForwards}
                    stepTo={actions.chooseStep}
                    stepMeForwards={actions.stepMeForwards}
                  />
                  <PlayerState
                    levels={game.levels}
                    {...game.timeline[currentStep].player}
                  />
                  <Button
                    id="bingoFinder"
                    onClick={async () => {
                      const maxWords = 2000;
                      let thisButton = document.getElementById("bingoFinder");
                      thisButton!.innerHTML =
                        "Finding a rack clear<br>Please wait...";
                      let currentPlay = findCurrentlyPlayedWord(
                        game,
                        currentStep
                      );
                      let allBingos: Array<Play[]> = [];
                      let wordCounter = [0];
                      const changeText = (lastBingo: Play[]) => {
                        allBingos.sort((a, b) => playsScore(b) - playsScore(a));
                        const bestText =
                          allBingos.length > 0
                            ? `Best: ${allBingos[0]
                                .map((b) => b.word.toUpperCase())
                                .join(" -> ")} (${playsScore(allBingos[0])}) `
                            : "Couldn't find a rack clear";
                        const lastText =
                          lastBingo.length > 0
                            ? `${lastBingo
                                .map((b) => b.word.toUpperCase())
                                .join(" -> ")} (${playsScore(
                                lastBingo
                              )}) (${wordCounter}/${maxWords} different words tried)`
                            : "Ready to find another";
                        thisButton!.innerHTML = `${bestText}<br>${lastText}`;
                      };
                      const bingoGenerator = currentPlay.findRackClears(
                        wordCounter,
                        () => {},
                        maxWords
                      );
                      while (true) {
                        const bingo = await bingoGenerator.next();
                        if (bingo.done) {
                          changeText([]);
                          break;
                        }
                        allBingos.push(bingo.value);
                        changeText(bingo.value);
                      }
                    }}
                  >
                    Find a rack clear<br></br>
                    (This is not final UI)
                  </Button>
                  <PlayerList
                    players={game.players}
                    selectedPlayer={selectedPlayer}
                    selectPlayer={actions.selectPlayer}
                    currentStep={currentStep}
                    timeline={game.timeline}
                  />
                </Stack>
              </Tab>
              <Tab eventKey="words" title="Words">
                <Stack className="p-2">
                  <Words
                    timeline={game.timeline}
                    currentStep={currentStep}
                    stepTo={actions.chooseStep}
                  />
                </Stack>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
