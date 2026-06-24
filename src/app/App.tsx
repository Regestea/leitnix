import "./App.css";
import {useEffect } from "react";
import useModal from "../shared/hooks/useModal.ts";
import Modal from "../shared/components/Modal.tsx";
import { useThemeStore, type ThemeName } from "../shared/store/themeStore.ts";
import { Outlet } from "react-router";
import Nav from "../shared/components/Nav.tsx";
import { useNavStore } from "../shared/store/navStore.ts";

function App() {
  

  return (
    <>

      <div className="main-wrapper">
        <Outlet />
      </div>

      <Nav />

      
    </>
  );
}

export default App;
