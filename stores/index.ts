import { createContext, useContext } from "react";
import { authStore } from "./authStore";

class RootStore {
  authStore = authStore;
}

export const rootStore = new RootStore();
export const StoreContext = createContext(rootStore);

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return store;
};
