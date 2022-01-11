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
  activeGameIndex: number;
  chooseGame: (index: number) => void;
}

function AppNavbar(props: AppNavbarProps): JSX.Element {
  const { showImport, games, activeGameIndex, chooseGame } = props;
  return (
    <Navbar bg="light" expand="md">
      <Container fluid>
        <Navbar.Brand>
          <img
            src={icon}
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="React Bootstrap logo"
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
                  index={activeGameIndex}
                  onPick={chooseGame}
                />
              )}
            </Stack>
          </Form>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            Created by Glenjamin on{" "}
            <a href="https://github.com/glenjamin/babblog-royale/">GitHub</a>
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
