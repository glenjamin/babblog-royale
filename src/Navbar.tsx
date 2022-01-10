import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";

import icon from "./icon.png";

interface AppNavbarProps {
  showImport(): void;
}
function AppNavbar({ showImport }: AppNavbarProps) {
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
          <Nav className="me-auto">
            <Button variant="outline-secondary" onClick={showImport}>
              Import...
            </Button>
          </Nav>
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
