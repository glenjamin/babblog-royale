import { useCallback, useRef, useState } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";

import { Game } from "./types";
import { newParser } from "./parser.mjs";

interface ImportProps {
  show: boolean;
  onImport(games: Game[]): void;
  onClose(): void;
}

function useThrottle<Args extends any[]>(
  fn: (...args: Args) => void,
  limit: number
): (...args: Args) => void {
  const last = useRef(0);
  return useCallback(
    (...args) => {
      const now = Date.now();
      if (now - last.current > limit) {
        last.current = now;
        fn(...args);
      }
    },
    [fn, limit]
  );
}

function Importer({ show, onImport, onClose }: ImportProps): JSX.Element {
  const [fileSize, setFileSize] = useState(0);
  const [progress, rawSetProgress] = useState(0);
  const setProgress = useThrottle(rawSetProgress, 100);
  const [error, setError] = useState<string>();

  async function parseFile(file: Blob) {
    setError(undefined);
    setFileSize(file.size);
    rawSetProgress(0);

    const parser = newParser();
    // The type cast is required because @types/node messes with the DOM type
    // See https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/58079
    const stream = file.stream() as any as ReadableStream<Uint8Array>;
    const reader = stream.getReader();
    const utf8Decoder = new TextDecoder("utf-8");
    let handled = 0;
    while (true) {
      let { value, done } = await reader.read();
      handled += value?.length || 0;
      const chunk = utf8Decoder.decode(value, { stream: !done });
      parser.parse(chunk);
      setProgress(handled);
      if (done) break;
    }
    rawSetProgress(file.size);
    parser.end();

    setFileSize(0);
    rawSetProgress(0);

    const games = parser.games();
    if (games.length === 0) {
      setError("No games found in log file. Try another file.");
      return;
    }

    setTimeout(() => {
      onImport(games);
    }, 500);
  }

  return (
    <Modal size="lg" show={show} onHide={() => onClose()}>
      <Modal.Header closeButton>
        <Modal.Title>Import Log File</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group as={Row} controlId="logFile" className="mb-3">
            <Form.Label column sm={2}>
              Log File
            </Form.Label>
            <Form.Group as={Col}>
              <Form.Control
                type="file"
                aria-describedby="logFileHelp"
                accept=".log"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  parseFile(e.target.files?.[0]!)
                }
                isInvalid={!!error}
              />
              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Text id="logFileHelp" muted>
              <p className="mt-3">
                On Windows this can be found at{" "}
                <code>
                  C:\Users\[YOURUSERNAME]\AppData\LocalLow\Everybody House
                  Games\BabbleRoyale\Player.log
                </code>
                .
              </p>
              <p>
                On macOS this can be found at{" "}
                <code>
                  ~/Library/Logs/Everybody House Games/BabbleRoyale/Player.log
                </code>
                .
              </p>
              <p>
                The file will not be uploaded to any server, all processing
                takes place inside your web browser.
              </p>
            </Form.Text>
            <Form.Text></Form.Text>
          </Form.Group>
        </Form>
        {fileSize > 0 && (
          <>
            <p>Loading file&hellip;</p>
            <ProgressBar
              animated
              label={`${fileSize}/${progress}B`}
              max={fileSize}
              now={progress}
            />
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => onClose()}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default Importer;
