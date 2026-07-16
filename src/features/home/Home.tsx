import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useNavStore } from "../../shared/store/navStore";
import { getHomeNavItems } from "./homeNavConfig";
import ProgressCircle from "./ProgressCircle";
import LearningProgress from "./LearningProgress";
import { useHome } from "./hooks/useHome";

export default function Home() {
  const setIsShowing = useNavStore((s) => s.setIsShowing);
  const setItems = useNavStore((s) => s.setItems);
  const navigate = useNavigate();
  const { learnedToday, pendingReview } = useHome();

  useEffect(() => {
    setItems(getHomeNavItems(navigate));
    setIsShowing(true);
  }, [setItems, setIsShowing, navigate]);

  return (
    <>
      <div className="title-section">
        <h1 className="styled-title">Leitnix</h1>
      </div>
      <div className="content-stack">
        <div className="cards-layout">
          <div className="cards-row">
            <div className="card-column">
              <div className="card glass learn-card">
                <div className="card-inner">
                  <ProgressCircle current={learnedToday} />
                </div>
              </div>
              <div className="card glass card-caption">
                <p className="card-caption-text">Today Learned</p>
              </div>
            </div>

            <div className="card-column">
              <div className="card glass learn-card">
                <div className="card-inner">
                  <ProgressCircle current={pendingReview} />
                </div>
              </div>
              <div className="card glass card-caption">
                <p className="card-caption-text">Pending Review</p>
              </div>
            </div>
          </div>

          <LearningProgress />
        </div>
      </div>
    </>
  );
}
