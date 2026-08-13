import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useSettingStore } from "../../../stores/settingStore";
import styles from "./MainContainer.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

interface MainContainerProps {
  children: ReactNode;
  header?: ReactNode;
  topBar?: ReactNode;
  footer?: ReactNode;
}

export default function MainContainer({
  children,
  header,
  topBar,
  footer,
}: MainContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEasyRead, setIsEasyRead] = useState(false);

  const { easyReadMode, easyReadBackgroundColor, easyReadTextColor } =
    useSettingStore();

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

  const handleEasyReadToggle = useCallback(() => {
    setIsEasyRead((prev) => !prev);
  }, []);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.fullscreenWrapper} ref={wrapperRef}>
        <div
          className={`${styles.mainContent} custom-font-style${isEasyRead ? ` ${styles.easyReadActive}` : ""}`}
          ref={contentRef}
          style={
            isEasyRead
              ? {
                  "--easy-read-bg": easyReadBackgroundColor,
                  "--easy-read-text": easyReadTextColor,
                } as React.CSSProperties
              : undefined
          }
        >
          <div className={styles.topBar}>
            {topBar && <span>{topBar}</span>}
            <div className={styles.topButtons}>
              {easyReadMode && (
                <button
                  className={`${styles.easyReadBtn}${isEasyRead ? ` ${styles.easyReadBtnActive}` : ""}`}
                  onClick={handleEasyReadToggle}
                  title={isEasyRead ? "Disable easy read mode" : "Enable easy read mode"}
                >
                  <FontAwesomeIcon icon={faEye}/>
                </button>
              )}
              <button
                className={styles.fullscreenBtn}
                onClick={handleToggle}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? "✕" : "⛶"}
              </button>
            </div>
          </div>
          {header && <div className={styles.mainHeader}>{header}</div>}
          <div className={styles.mainScrollArea}>{children}</div>
          {footer && <div className={styles.mainFooter}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
