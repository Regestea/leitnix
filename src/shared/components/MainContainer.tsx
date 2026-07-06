import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import "./MainContainer.css";

interface MainContainerProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

export default function MainContainer({ children, header, footer }: MainContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const handleToggle = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <div className="main-container">
      <div className="fullscreen-wrapper" ref={wrapperRef}>
        <div className="main-content custom-font-style" ref={contentRef}>
          <button
            className="fullscreen-btn"
            onClick={handleToggle}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? "✕" : "⛶"}
          </button>
          {header && <div className="main-header">{header}</div>}
          <div className="main-scroll-area">
            {children}
          </div>
          {footer && <div className="main-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
