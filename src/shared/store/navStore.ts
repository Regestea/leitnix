import { create } from "zustand";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface NavChild {
  icon: IconDefinition;
  title: string;
  onClick?: () => void;
}
export interface NavItem {
  icon: IconDefinition;
  title: string;
  onClick?: () => void;
  children?: NavChild[];
}
export interface NavState {
  isShowing: boolean;
  items: NavItem[];
  setIsShowing: (val: boolean) => void;
  setItems: (items: NavItem[]) => void;
  addItem: (item: NavItem) => void;
  removeItem: (title: string) => void;
  updateItem: (title: string, patch: Partial<NavItem>) => void;
}

export const useNavStore = create<NavState>((set) => ({
  isShowing: true,
  items: [],

  setIsShowing: (val) => set({ isShowing: val }),

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  removeItem: (title) =>
    set((state) => ({
      items: state.items.filter((i) => i.title !== title),
    })),

  updateItem: (title, patch) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.title === title ? { ...i, ...patch } : i,
      ),
    })),
}));
