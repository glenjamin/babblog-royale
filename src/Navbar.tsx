import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Navbar from "react-bootstrap/Navbar";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import GamePicker from "./GamePicker";

import { Game } from "./types";

import icon from "./icon.png";

interface AppNavbarProps {
  showImport: () => void;
  games: Game[];
  activeGameID: number;
  chooseGame: (id: number) => void;
}

function AppNavbar(props: AppNavbarProps): JSX.Element {
  const { showImport, games, activeGameID, chooseGame } = props;
  return (
    <Navbar bg="light" expand="md">
      <Container fluid>
        <Navbar.Brand>
          <img
            src={icon}
            width="25"
            height="25"
            className="align-top"
            alt="Logo"
          />{" "}
          Babble Royale Log Viewer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Form>
            <Stack direction="horizontal" gap={3}>
              <Button
                variant={games.length === 0 ? "primary" : "outline-secondary"}
                onClick={showImport}
              >
                Import...
              </Button>
              {games.length > 0 && (
                <GamePicker
                  games={games}
                  activeID={activeGameID}
                  onPick={chooseGame}
                />
              )}
            </Stack>
          </Form>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <Stack>
            <Navbar.Text className="p-0 text-end">
              Created by Glenjamin on{" "}
              <a href="https://github.com/glenjamin/babblog-royale/">GitHub</a>
              <br />
              for{" "}
              <a href="https://store.steampowered.com/app/1759440/Babble_Royale/">
                Babble Royale
              </a>
            </Navbar.Text>
          </Stack>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
