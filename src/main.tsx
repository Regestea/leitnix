import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/router.tsx";
import { StrictMode } from "react";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
