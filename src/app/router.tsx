import { createBrowserRouter } from "react-router";
import App from "./App.tsx";
import NotFound from "../features/notFound/NotFound.tsx";
import Home from "../features/home/Home.tsx";
import StudyTopic from "../features/learnTopic/learnTopic.tsx";
import Theme from "../features/theme/Theme.tsx";
import AiModels from "../features/aiModels/AiModels.tsx";
import Prompt from "../features/customPrompt/Prompt.tsx";
import BoxManagement from "../features/boxManagement/BoxManagement.tsx";
import AddCard from "../features/addCard/AddCard.tsx";
import Review from "../features/review/Review.tsx";
import CardManagement from "../features/cardManagement/CardManagement.tsx";
import Settings from "../features/settings/Settings.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "add-card",
        element: <AddCard />,
      },
      {
        path: "learn-topic",
        element: <StudyTopic />,
      },
      {
        path: "ai-models",
        element: <AiModels />,
      },
      {
        path: "theme",
        element: <Theme />,
      },
      {
        path: "custom-prompt",
        element: <Prompt />,
      },
      {
        path: "box-management",
        element: <BoxManagement />,
      },
      {
        path: "review",
        element: <Review />,
      },
      {
        path: "card-management",
        element: <CardManagement />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);
