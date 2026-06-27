import type { ReactNode } from "react";
import "./MainContainer.css";

interface MainContainerProps {
  children: ReactNode;
}

export default function MainContainer({ children }: MainContainerProps) {

  return (
    <div className="main-container">
      <div className="main-content custom-font-style">
        {children}
      </div>
    </div>
  );
}
