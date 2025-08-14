import {
  require_react
} from "./chunk-DEYA5VCL.js";
import {
  __name,
  __toESM
} from "./chunk-6PEHRAEP.js";

// node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = /* @__PURE__ */ __name((createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = /* @__PURE__ */ __name((partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  }, "setState");
  const getState = /* @__PURE__ */ __name(() => state, "getState");
  const getInitialState = /* @__PURE__ */ __name(() => initialState, "getInitialState");
  const subscribe = /* @__PURE__ */ __name((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, "subscribe");
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api);
  return api;
}, "createStoreImpl");
var createStore = /* @__PURE__ */ __name((createState) => createState ? createStoreImpl(createState) : createStoreImpl, "createStore");

// node_modules/zustand/esm/react.mjs
var import_react = __toESM(require_react(), 1);
var identity = /* @__PURE__ */ __name((arg) => arg, "identity");
function useStore(api, selector = identity) {
  const slice = import_react.default.useSyncExternalStore(
    api.subscribe,
    import_react.default.useCallback(() => selector(api.getState()), [api, selector]),
    import_react.default.useCallback(() => selector(api.getInitialState()), [api, selector])
  );
  import_react.default.useDebugValue(slice);
  return slice;
}
__name(useStore, "useStore");
var createImpl = /* @__PURE__ */ __name((createState) => {
  const api = createStore(createState);
  const useBoundStore = /* @__PURE__ */ __name((selector) => useStore(api, selector), "useBoundStore");
  Object.assign(useBoundStore, api);
  return useBoundStore;
}, "createImpl");
var create = /* @__PURE__ */ __name((createState) => createState ? createImpl(createState) : createImpl, "create");
export {
  create,
  createStore,
  useStore
};
//# sourceMappingURL=zustand.js.map
