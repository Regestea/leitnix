import { createBrowserRouter } from "react-router";
import App from "./App.tsx";
import NotFound from "../features/notFound/NotFound.tsx";
import AddTopic from "../features/addTopic/AddTopic.tsx";
import Home from "../features/home/Home.tsx";
import StudyTopic from "../features/learnTopic/learnTopic.tsx";
import Theme from "../features/theme/Theme.tsx";


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
        path: "add-topic",
        element: <AddTopic />,
      },
      {
        path: "learn-topic",
        element: <StudyTopic />,
      },
      {
        path: "theme",
        element: <Theme />,
      },
    ],
  },
]);
