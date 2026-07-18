import { Outlet, useLocation, useNavigate } from "react-router";
import Nav from "../shared/components/Nav.tsx";
import { useThemeStore } from "../features/theme/store/themeStore.ts";
import { useSettingStore } from "../features/settings/store/settingStore.ts";
import { useEffect, useState, useRef } from "react";
import { initializeDatabase } from "../db/connection.ts";
import { useNavStore } from "../shared/store/navStore.ts";
import { getHomeNavItems } from "../features/home/homeNavConfig.ts";
import { rescheduleDailyNotification } from "../services/notificationService.ts";

function App() {
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const setItems = useNavStore((s) => s.setItems);

  useEffect(() => {
    setItems(getHomeNavItems(navigate, pathname));
  }, [setItems, navigate, pathname]);

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