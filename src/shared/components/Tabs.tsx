import { useState, type ReactNode } from "react";
import "./Tabs.css";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
}

export default function Tabs({ tabs, defaultTabId, className }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className={`tabs${className ? ` ${className}` : ""}`}>
      <div className="tabs-header" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`tabs-btn${isActive ? " tabs-btn--active" : ""}`}
              onClick={() => setActiveId(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="tabs-body" role="tabpanel">
        {active.content}
      </div>
    </div>
  );
}
