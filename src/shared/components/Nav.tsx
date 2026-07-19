import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faRobot,
  faBox,
  faPaintBrush,
  faCode,
  faList,
  faCircleQuestion,
  faPlus,
  faGraduationCap,
  faClipboardCheck,
  faHome,
  faSliders,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import styles from "./Nav.module.css";

interface NavChild {
  icon: IconDefinition;
  title: string;
  onClick?: () => void;
}

interface NavItem {
  icon: IconDefinition;
  title: string;
  onClick?: () => void;
  children?: NavChild[];
}

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

function getNavItems(navigate: ReturnType<typeof useNavigate>, pathname: string): NavItem[] {
  return [
    ...(pathname === "/"
      ? [
          {
            icon: faCircleQuestion,
            title: "Help",
            onClick: () => console.log("Help"),
          },
        ]
      : [
          {
            icon: faHome,
            title: "Home",
            onClick: () => navigate("/"),
          },
        ]),
    {
      icon: faPlus,
      title: "Add New Card",
      onClick: () => navigate("/add-card"),
    },
    {
      icon: faGraduationCap,
      title: "Learn",
      onClick: () => navigate("/learn-topic"),
    },
    {
      icon: faClipboardCheck,
      title: "Review",
      onClick: () => navigate("/review"),
    },
    {
      icon: faCog,
      title: "Settings",
      children: [
        {
          icon: faPaintBrush,
          title: "Theme",
          onClick: () => navigate("/theme"),
        },
        {
          icon: faCode,
          title: "User Prompt",
          onClick: () => navigate("/custom-prompt"),
        },
        {
          icon: faBox,
          title: "Box Management",
          onClick: () => navigate("/box-management"),
        },
        {
          icon: faRobot,
          title: "AI Models",
          onClick: () => navigate("/ai-models"),
        },
        {
          icon: faList,
          title: "Card Management",
          onClick: () => navigate("/card-management"),
        },
        {
          icon: faSliders,
          title: "Settings",
          onClick: () => navigate("/settings"),
        },
      ],
    },
  ];
}

export default function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = getNavItems(navigate, pathname);

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
      <nav ref={navRef} className={`${styles.bottomNav} glass`}>
        {items.map((item: NavItem, index: number) => {
          if (!item.children?.length) return null;
          const isOpen = expandedIndex === index;
          const angles = calcAngles(item.children.length);

          return (
            <div
              key={item.title}
              className={`${styles.radialMenu}${isOpen ? ` ${styles.radialMenuOpen}` : ""}`}
            >
              {item.children.map((child: NavChild, i: number) => (
                <div
                  key={child.title}
                  className={`${styles.radialItem} ${styles[`radialItemNth${i + 1}` as keyof typeof styles]}`}
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

        <div className={styles.navItems}>
          {items.map((item: NavItem, index: number) => {
            const isExpanded = expandedIndex === index;
            const isHidden = isAnyExpanded && !isExpanded;

            return (
              <button
                key={item.title}
                className={[
                  styles.navBtn,
                  "glass",
                  isExpanded ? styles.navBtnActive : "",
                  isHidden ? styles.navBtnHide : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                title={item.title}
                onClick={(e) => handleParentClick(e, index)}
              >
                <FontAwesomeIcon
                  icon={isExpanded ? faXmark : item.icon}
                  className={styles.navIcon}
                />
              </button>
            );
          })}
        </div>
      </nav>

      <div
        id="pageOverlay"
        className={`${styles.pageOverlay}${isAnyExpanded ? ` ${styles.pageOverlayOpen}` : ""}`}
        aria-hidden="true"
        onClick={() => updateExpanded(null)}
      />
    </>
  );
}
