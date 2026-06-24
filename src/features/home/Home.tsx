import { faBell, faCheck, faHome } from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";
import LearningProgress from "../../shared/components/LearningProgress";
import ProgressCircle from "../../shared/components/ProgressCircle";
import { useNavStore } from "../../shared/store/navStore";

export default function Home() {
  const setItems = useNavStore((s) => s.setItems);

  useEffect(() => {
    setItems([
      {
        icon: faHome,
        title: "Home",
        onClick: () => console.log("Home"),
      },
      {
        icon: faBell,
        title: "Alerts",
        children: [
          { icon: faCheck, title: "Mark all read", onClick: () => {} },
        ],
      },
    ]);
  }, [setItems]);

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
    </>
  );
}