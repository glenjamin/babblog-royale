import { useCallback, useState } from "react";

import Navbar from "./Navbar";
import GameViewer from "./Game";

import { Game } from "./types";
import Importer from "./Importer";

function App() {
  const [importShown, setShowImport] = useState(false);
  const [games, setGames] = useState<Game[]>([]);

  const showImport = useCallback(() => setShowImport(true), [setShowImport]);
  const hideImport = useCallback(() => setShowImport(false), [setShowImport]);
  const onImport = useCallback(
    (games: Game[]) => {
      setGames(games);
      hideImport();
    },
    [hideImport, setGames]
  );

  return (
    <>
      <Navbar showImport={showImport} />
      <Importer show={importShown} onImport={onImport} onClose={hideImport} />
      <GameViewer games={games} showImport={showImport} />
    </>
  );
}

export default App;
