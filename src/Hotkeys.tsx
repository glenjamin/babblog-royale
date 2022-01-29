import Modal from "react-bootstrap/Modal";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";

import { useHotkeys } from "react-hotkeys-hook";

interface HotkeyProps {
  showHelp: boolean;
  isRecording: boolean;
  toggleHotkeyHelp(): void;
  hideHotkeyHelp(): void;
  showImport(): void;
  stepBack(): void;
  stepForwards(): void;
  stepMeBack(): void;
  stepMeForwards(): void;
}

function Hotkeys({
  showHelp,
  isRecording,
  ...actions
}: HotkeyProps): JSX.Element {
  useHotkeys("shift+/,?,h", actions.toggleHotkeyHelp);
  useHotkeys("i", actions.showImport);
  useHotkeys("left", () => !isRecording && actions.stepBack(), [isRecording]);
  useHotkeys("right", () => !isRecording && actions.stepForwards(), [
    isRecording,
  ]);
  useHotkeys("up", () => !isRecording && actions.stepMeBack(), [isRecording]);
  useHotkeys("down", () => !isRecording && actions.stepMeForwards(), [
    isRecording,
  ]);

  return (
    <Modal show={showHelp} onHide={actions.hideHotkeyHelp}>
      <Modal.Header closeButton>
        <Modal.Title>Keyboard Shortcuts</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup>
          <ListGroup.Item>
            Show Help
            <Hotkey hotkey="?" />
            <Hotkey hotkey="h" />
          </ListGroup.Item>
          <ListGroup.Item>
            Open Import Dialog
            <Hotkey hotkey="i" />
          </ListGroup.Item>
          <ListGroup.Item>
            Go back a step
            <Hotkey hotkey="left" />
          </ListGroup.Item>
          <ListGroup.Item>
            Go forward a step
            <Hotkey hotkey="right" />
          </ListGroup.Item>
          <ListGroup.Item>
            Go back to your last step
            <Hotkey hotkey="up" />
          </ListGroup.Item>
          <ListGroup.Item>
            Go forwards to your next step
            <Hotkey hotkey="down" />
          </ListGroup.Item>
        </ListGroup>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={actions.hideHotkeyHelp}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function Hotkey({ hotkey }: { hotkey: string }): JSX.Element {
  return <kbd className="float-end mx-1">{hotkey}</kbd>;
}

export default Hotkeys;
