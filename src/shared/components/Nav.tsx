import { useState, useEffect, useRef, type CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import "./Nav.css";
import { useNavStore, type NavState, type NavItem, type NavChild } from "../store/navStore.ts";

function calcAngles(count: number): string[] {
  const MAX_SPREAD = 180;
  const MIN_STEP = 30;
  const MAX_STEP = 80;

  const rawStep = count > 1 ? MAX_SPREAD / (count - 1) : 0;
  const stepDeg = Math.min(MAX_STEP, Math.max(MIN_STEP, rawStep));

  const total = (count - 1) * stepDeg;
  const start = -total / 2;
  return Array.from({ length: count }, (_, i) => `${start + i * stepDeg}deg`);
}

export default function Nav() {
  const items = useNavStore((s: NavState) => s.items);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const navRef = useRef<HTMLDivElement>(null);
  const expandedIndexRef = useRef<number | null>(null);

  function updateExpanded(val: number | null) {
    expandedIndexRef.current = val;
    setExpandedIndex(val);
  }

  const isAnyExpanded = expandedIndex !== null;
  
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        expandedIndexRef.current !== null &&
        !navRef.current?.contains(e.target as Node)
      ) {
        updateExpanded(null);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  function handleParentClick(e: React.MouseEvent, index: number) {
    e.stopPropagation();
    const item = items[index];
    if (item.children?.length) {
      updateExpanded(expandedIndexRef.current === index ? null : index);
    } else {
      item.onClick?.();
      updateExpanded(null);
    }
  }

  function handleChildClick(child: NavChild) {
    child.onClick?.();
    updateExpanded(null);
  }

  return (
    <>
      <nav ref={navRef} className="bottom-nav glass">
        {items.map((item: NavItem, index: number) => {
          if (!item.children?.length) return null;
          const isOpen = expandedIndex === index;
          const angles = calcAngles(item.children.length);

          return (
            <div
              key={item.title}
              className={`radial-menu${isOpen ? " open" : ""}`}
            >
              {item.children.map((child: NavChild, i: number) => (
                <div
                  key={child.title}
                  className="radial-item"
                  style={{ "--angle": angles[i] } as CSSProperties}
                  onClick={() => handleChildClick(child)}
                  title={child.title}
                >
                  <FontAwesomeIcon icon={child.icon} />
                </div>
              ))}
            </div>
          );
        })}

        <div className="nav-items">
          {items.map((item: NavItem, index: number) => {
            const isExpanded = expandedIndex === index;
            const isHidden = isAnyExpanded && !isExpanded;

            return (
              <button
                key={item.title}
                className={[
                  "nav-btn",
                  "glass",
                  isExpanded ? "active" : "",
                  isHidden ? "hide" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                title={item.title}
                onClick={(e) => handleParentClick(e, index)}
              >
                <FontAwesomeIcon
                  icon={isExpanded ? faXmark : item.icon}
                  className="nav-icon"
                />
              </button>
            );
          })}
        </div>
      </nav>

      <div
        id="pageOverlay"
        className={`page-overlay${isAnyExpanded ? " open" : ""}`}
        aria-hidden="true"
        onClick={() => updateExpanded(null)}
      />
    </>
  );
}