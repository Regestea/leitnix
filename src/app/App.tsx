import "./App.css";
import { Outlet } from "react-router";
import Nav from "../shared/components/Nav.tsx";
import { useThemeStore } from "../shared/store/themeStore.ts";
import { useEffect, useState } from "react";
import { initializeDatabase } from "../db/leitnixDB.ts";

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function appInitializer() {
      await initializeDatabase();
      await useThemeStore.persist.rehydrate();
      setIsReady(true);
    }

    appInitializer();
  }, []);

  if (!isReady) {
    return null;
  }

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