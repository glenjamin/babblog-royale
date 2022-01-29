import { useCallback, useState } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";

import * as zip from "@zip.js/zip.js";

import { Game } from "./types";
import { newParser } from "./parser";

interface ImportProps {
  show: boolean;
  onImport(games: Game[]): void;
  onClose(): void;
}

function Importer({ show, onImport, onClose }: ImportProps): JSX.Element {
  const [{ loading, error }, setState] = useState<{
    loading?: true;
    error?: string;
  }>({});
  const setLoading = useCallback(
    (loading: boolean) => setState(loading ? { loading } : {}),
    [setState]
  );
  const setError = useCallback(
    (error: string) => setState({ error }),
    [setState]
  );

  async function parseFile(file: File) {
    setLoading(true);

    let blobs: Array<Blob> = [];
    let games: Array<Game> = [];

    let blob: Blob = file;
    if (file.name.endsWith(".zip")) {
      const reader = new zip.ZipReader(new zip.BlobReader(blob));
      const entries = await reader.getEntries();
      for (let entry of entries) {
        blobs.push(await entry.getData!(new zip.BlobWriter()));
      }
    } else {
      blobs = [file];
    }

    for (let blob of blobs){
      const parser = newParser();
      // The type cast is required because @types/node messes with the DOM type
      // See https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/58079
      const stream = blob.stream() as any as ReadableStream<Uint8Array>;
      const reader = stream.getReader();
      const utf8Decoder = new TextDecoder("utf-8");
      while (true) {
        let { value, done } = await reader.read();
        const chunk = utf8Decoder.decode(value, { stream: !done });
        parser.parse(chunk);
        if (done) break;
      }
      parser.end();

      games.push(...parser.games());
    }

    if (games.length === 0) {
      return setError("No games found in this file. Try another file.");
    }

    setTimeout(() => {
      setLoading(false);
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
                accept=".log,.zip"
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
                If you want to keep a lot of files and save some space, you can
                compress them into <code>.zip</code> files and these will also
                be accepted.
              </p>
              <p>
                The file will not be uploaded to any server, all processing
                takes place inside your web browser.
              </p>
            </Form.Text>
            <Form.Text></Form.Text>
          </Form.Group>
        </Form>
        {loading && <ProgressBar animated label="Loading..." now={100} />}
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
