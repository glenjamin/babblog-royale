import { useMemo, useReducer } from "react";
import placeholderGame from "./placeholder-game";
import { Game } from "./types";

type State = {
  games: Game[];
  game: Game;
  gameStep: number; // index into game timeline
  selectedPlayer: number | null; // index into players
  showImportDialog: boolean;
  showHotkeyHelp: boolean;
  isRecording: boolean;
};

const initialState: State = {
  games: [],
  game: placeholderGame,
  gameStep: 0,
  selectedPlayer: null,
  showImportDialog: false,
  showHotkeyHelp: false,
  isRecording: false,
};

const creators = {
  showImport: () => {},
  cancelImport: () => {},
  toggleHotkeyHelp: () => {},
  hideHotkeyHelp: () => {},
  importGames: (games: Game[]) => ({ games }),
  chooseGame: (id: number) => ({ id }),
  chooseStep: (step: number) => ({ step }),
  stepBack: () => {},
  stepForwards: () => {},
  stepMeBack: () => {},
  stepMeForwards: () => {},
  selectPlayer: (player: number | null) => ({ player }),
  setIsRecording: (isRecording: boolean) => ({ isRecording }),
};

const handlers: Handlers = {
  showImport(state) {
    return update(state, { showImportDialog: true });
  },
  cancelImport(state) {
    return update(state, { showImportDialog: false });
  },
  toggleHotkeyHelp(state) {
    return update(state, { showHotkeyHelp: !state.showHotkeyHelp });
  },
  hideHotkeyHelp(state) {
    return update(state, { showHotkeyHelp: false });
  },
  importGames(state, { games }) {
    return update(state, {
      games,
      game: games[games.length - 1] || placeholderGame,
      gameStep: 0,
      showImportDialog: false,
      selectedPlayer: null,
    });
  },
  chooseGame(state, { id }) {
    return update(state, {
      game: state.games.find((g) => g.id === id) || placeholderGame,
      gameStep: 0,
      selectedPlayer: null,
    });
  },
  chooseStep(state, { step }) {
    const { game } = state;
    if (step < 0) step = 0;
    const max = game.timeline.length - 1;
    if (step >= max) step = max;
    return update(state, { gameStep: step });
  },
  stepBack(state) {
    return reducer(state, {
      name: "chooseStep",
      payload: { step: state.gameStep - 1 },
    });
  },
  stepForwards(state) {
    return reducer(state, {
      name: "chooseStep",
      payload: { step: state.gameStep + 1 },
    });
  },
  stepMeBack(state) {
    const { game, gameStep } = state;
    return reducer(state, {
      name: "chooseStep",
      payload: { step: findMyStep(game, gameStep, -1) },
    });
  },
  stepMeForwards(state) {
    const { game, gameStep } = state;
    return reducer(state, {
      name: "chooseStep",
      payload: { step: findMyStep(game, gameStep, 1) },
    });
  },
  selectPlayer(state, { player }) {
    return update(state, { selectedPlayer: player });
  },
  setIsRecording(state, { isRecording }) {
    return update(state, { isRecording });
  },
};

function findMyStep(game: Game, step: number, direction: number): number {
  while (true) {
    step = step + direction;

    // Reached the end
    if (step <= 0 || step >= game.timeline.length - 1) {
      return step;
    }

    const gameStep = game.timeline[step];
    // Found some words or player died
    if (gameStep.player.words.length || step === game.players[0].killedStep) {
      return step;
    }
  }
}

type ActionName = keyof typeof creators;
type ActionPayload<Name extends ActionName> = ReturnType<typeof creators[Name]>;
type ActionInput<Name extends ActionName> = Parameters<typeof creators[Name]>;
type ValueOf<T> = T[keyof T];
type Action = ValueOf<{
  [Name in ActionName]: {
    name: Name;
    payload: ActionPayload<Name>;
  };
}>;
type Handlers = {
  [Name in ActionName]: (state: State, payload: ActionPayload<Name>) => State;
};
type Actions = {
  [Name in ActionName]: (...args: ActionInput<Name>) => void;
};

function reducer(state: State, action: Action): State {
  const handler = handlers[action.name];
  if (handler) {
    // Typescript is going to have to trust us on this one
    // The Handlers and Action types are both derived from the
    // action creators, so the names and payloads are in sync
    return handler(state, action.payload as any);
  }
  console.warn("Unhandled action", { action });
  return state;
}

function update<T>(state: T, changes: Partial<T>): T {
  return Object.assign({}, state, changes);
}

export default function useAppReducer(): [State, Actions] {
  const [state, dispatch] = useReducer(reducer, initialState);
  const actions = useMemo(() => {
    const x = {} as Actions;
    Object.keys(creators).forEach((name) => {
      // @ts-expect-error
      x[name] = (...p) => dispatch({ name, payload: creators[name](...p) });
    });
    return x;
  }, [dispatch]);
  return [state, actions];
}
