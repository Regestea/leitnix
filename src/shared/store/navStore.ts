import { create } from "zustand";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faHome,
  faCog,
  faSearch,
  faBookOpen,
  faEnvelope,
  faStar,
  faGear,
  faRotateBack,
  faSchool,
  faPaintBrush
} from "@fortawesome/free-solid-svg-icons";

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

export const DEFAULT_ITEMS: NavItem[] = [
  {
    icon: faHome,
    title: "Home",
    onClick: () => console.log("Home clicked"),
  },
  {
    icon: faBookOpen,
    title: "Learn",
    children: [
      { icon: faSearch, title: "Search",    onClick: () => console.log("Search") },
      { icon: faStar,   title: "Favorites", onClick: () => console.log("Favorites") },
      { icon: faSchool, title: "School",    onClick: () => console.log("School") },
    ],
  },
  {
    icon: faCog,
    title: "Settings",
    children: [
      { icon: faPaintBrush, title: "Theme",         onClick: () => console.log("Theme") },
      { icon: faGear,       title: "Preferences",   onClick: () => console.log("Preferences") },
      { icon: faEnvelope,   title: "Notifications", onClick: () => console.log("Notifications") },
      { icon: faStar,       title: "Favorites",     onClick: () => console.log("Favorites") },
      { icon: faSearch,     title: "Search",        onClick: () => console.log("Search") },
      { icon: faBookOpen,   title: "Docs",          onClick: () => console.log("Docs") },
      { icon: faHome,       title: "Home",          onClick: () => console.log("Home") },
    ],
  },
  {
    icon: faRotateBack,
    title: "Back",
    onClick: () => console.log("Back clicked"),
  },
];

export const useNavStore = create<NavState>((set) => ({
  isShowing: true,
  items: DEFAULT_ITEMS,

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
        i.title === title ? { ...i, ...patch } : i
      ),
    })),
}));