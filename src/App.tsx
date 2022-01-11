import Navbar from "./Navbar";
import GameViewer from "./Game";

import Importer from "./Importer";
import { useAppReducer } from "./reducer";

function App() {
  const [state, actions] = useAppReducer();

  return (
    <>
      <Navbar showImport={actions.showImport} />
      <Importer
        show={state.showImportDialog}
        onImport={actions.importGames}
        onClose={actions.cancelImport}
      />
      <GameViewer games={state.games} showImport={actions.showImport} />
    </>
  );
}

export default App;
