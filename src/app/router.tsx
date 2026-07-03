import { createBrowserRouter } from "react-router";
import App from "./App.tsx";
import NotFound from "../features/notFound/NotFound.tsx";
import Home from "../features/home/Home.tsx";
import StudyTopic from "../features/learnTopic/learnTopic.tsx";
import Theme from "../features/theme/Theme.tsx";
import AiModels from "../features/AiModels/AiModels.tsx";
import Prompt from "../features/customPrompt/Prompt.tsx";
import AddCard from "../features/addCard/AddCard.tsx";

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
    ],
  },
]);
