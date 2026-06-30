import "./App.css";
import { Outlet } from "react-router";
import Nav from "../shared/components/Nav.tsx";
import { useThemeStore } from "../shared/store/themeStore.ts";
import { useEffect } from "react";

function App() {

  useEffect(() => {
    useThemeStore.getState().initialize();
  }, []);

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
