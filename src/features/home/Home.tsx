import { useEffect, useCallback } from "react";
import {
  faCog,
  faRobot,
  faBell,
  faPaintBrush,
  faCode,
  faList,
  faCircleQuestion,
  faPlus,
  faGraduationCap,
  faClipboardCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useThemeStore, type ThemeName } from "../../shared/store/themeStore";
import LearningProgress from "../../shared/components/LearningProgress";
import ProgressCircle from "../../shared/components/ProgressCircle";
import { useNavStore, type NavItem } from "../../shared/store/navStore";
import Modal from "../../shared/components/Modal";
import useModal from "../../shared/hooks/useModal";

export default function Home() {
  const { theme, setTheme } = useThemeStore();
  const { isOpen: isThemeOpen, open: openThemeModal, close: closeThemeModal } = useModal();

  const setIsShowing = useNavStore((s) => s.setIsShowing);
  const setItems = useNavStore((s) => s.setItems);

  const openThemeModalCb = useCallback(() => openThemeModal(), [openThemeModal]);

  useEffect(() => {
    const HOME_NAV_ITEMS: NavItem[] = [
      {
        icon: faPlus,
        title: "Add New Topic To Learn",
        onClick: () => console.log("Add New Topic To Learn"),
      },
      {
        icon: faGraduationCap,
        title: "Learn",
        onClick: () => console.log("Learn clicked"),
      },
      {
        icon: faClipboardCheck,
        title: "Review",
        onClick: () => console.log("Review clicked"),
      },
      {
        icon: faCog,
        title: "Settings",
        children: [
          { icon: faPaintBrush, title: "Theme",         onClick: openThemeModalCb },
          { icon: faCode,       title: "User Prompt",   onClick: () => console.log("Preferences") },
          { icon: faBell,       title: "Notifications", onClick: () => console.log("Notifications") },
          { icon: faRobot,       title: "AI Models",     onClick: () => console.log("Favorites") },
          { icon: faList,     title: "Edit list of words",        onClick: () => console.log("Search") },
          { icon: faCircleQuestion ,       title: "Help",          onClick: () => console.log("Home") },
        ],
      },
      
    ];

    setItems(HOME_NAV_ITEMS);
    setIsShowing(true);
  }, [openThemeModalCb, setItems, setIsShowing]);

  useEffect(() => {
    setIsShowing(!isThemeOpen);
  }, [isThemeOpen, setIsShowing]);

  return (
    <>
      <div className="title-section">
        <h1 className="title">Leitnix</h1>
      </div>
      <div className="content-stack">
        <div className="cards-layout">
          <div className="cards-row">
            <div className="card-column">
              <div className="card glass learn-card">
                <div className="card-inner">
                  <ProgressCircle current={28} total={45} />
                </div>
              </div>
              <div className="card glass card-caption">
                <p className="card-caption-text">Today Words</p>
              </div>
            </div>

            <div className="card-column">
              <div className="card glass learn-card">
                <div className="card-inner">
                  <ProgressCircle current={15} total={45} />
                </div>
              </div>
              <div className="card glass card-caption">
                <p className="card-caption-text">Today Review</p>
              </div>
            </div>
          </div>

          <LearningProgress />
        </div>
      </div>

      <Modal isOpen={isThemeOpen} onClose={closeThemeModal} title="Theme">
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ overflow: "auto" }}>
            <div className="settings-field">
              <label className="settings-label">Theme</label>
              <select
                className="custom-select"
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeName)}
              >
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}