import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";

import icon from "./icon.png";

function App() {
  return (
    <Navbar bg="light" expand>
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
      </Container>
    </Navbar>
  );
}

export default App;
