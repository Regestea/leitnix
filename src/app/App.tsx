import { Outlet } from "react-router";
import Nav from "../shared/components/nav/Nav.tsx";
import { useThemeStore } from "../stores/themeStore.ts";
import { useSettingStore } from "../stores/settingStore.ts";
import { useEffect, useState, useRef } from "react";
import { initializeDatabase } from "../db/connection.ts";
import { rescheduleDailyNotification } from "../services/notificationService.ts";

function App() {
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function appInitializer() {
      try {
        await initializeDatabase();
        await useThemeStore.persist.rehydrate();
        await useSettingStore.persist.rehydrate();
        await rescheduleDailyNotification();
      } catch (error) {
        console.error("App initialization failed:", error);
        return;
      }
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