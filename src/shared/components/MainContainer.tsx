import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import styles from "./MainContainer.module.css";

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
    <div className={styles.mainContainer}>
      <div className={styles.fullscreenWrapper} ref={wrapperRef}>
        <div className={`${styles.mainContent} custom-font-style`} ref={contentRef}>
          <button
            className={styles.fullscreenBtn}
            onClick={handleToggle}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? "✕" : "⛶"}
          </button>
          {header && <div className={styles.mainHeader}>{header}</div>}
          <div className={styles.mainScrollArea}>
            {children}
          </div>
          {footer && <div className={styles.mainFooter}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
