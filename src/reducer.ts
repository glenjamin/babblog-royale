import { useMemo, useReducer } from "react";
import { Game } from "./types";

type State = {
  games: Game[];
  gameIndex: number; // index into games
  gameStep: number; // index into game timeline
  showImportDialog: boolean;
  selectedPlayer: number | null; // index into players
};

const initialState: State = {
  games: [],
  gameIndex: -1,
  gameStep: 0,
  showImportDialog: false,
  selectedPlayer: null,
};

const creators = {
  showImport: () => {},
  cancelImport: () => {},
  importGames: (games: Game[]) => ({ games }),
  chooseGame: (index: number) => ({ index }),
  chooseStep: (step: number) => ({ step }),
  stepBack: () => {},
  stepForwards: () => {},
  selectPlayer: (player: number | null) => ({ player }),
};

const handlers: Handlers = {
  showImport(state) {
    return update(state, { showImportDialog: true });
  },
  cancelImport(state) {
    return update(state, { showImportDialog: false });
  },
  importGames(state, { games }) {
    return update(state, {
      games,
      gameIndex: games.length - 1,
      gameStep: 0,
      showImportDialog: false,
      selectedPlayer: null,
    });
  },
  chooseGame(state, { index }) {
    return update(state, {
      gameIndex: index,
      gameStep: 0,
      selectedPlayer: null,
    });
  },
  chooseStep(state, { step }) {
    const { gameIndex, games } = state;
    if (step < 0) step = 0;
    const max = games[gameIndex].board.timeline.length;
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
  selectPlayer(state, { player }) {
    return update(state, { selectedPlayer: player });
  },
};

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
