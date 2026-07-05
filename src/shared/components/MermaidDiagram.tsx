import React, { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

const createMermaidId = (() => {
  let count = 0;
  return () => `mermaid-diagram-${++count}`;
})();

function MermaidDiagram({ chart }: { chart: string }) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (diagramRef.current) {
      mermaid.render(createMermaidId(), chart).then(({ svg }) => {
        if (diagramRef.current) diagramRef.current.innerHTML = svg;
      });
    }
  }, [chart]);

  const updateTransform = useCallback((newScale: number, newPos: { x: number; y: number }) => {
    scaleRef.current = newScale;
    positionRef.current = newPos;
    setScale(newScale);
    setPosition(newPos);
  }, []);

  const handleReset = useCallback(() => {
    updateTransform(1, { x: 0, y: 0 });
  }, [updateTransform]);

  // --- Mouse ---
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newPos = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    };
    positionRef.current = newPos;
    setPosition(newPos);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.min(Math.max(scaleRef.current - e.deltaY * 0.001, 0.2), 5);
    updateTransform(newScale, positionRef.current);
  };

  // --- Touch ---
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const now = performance.now();
      if (now - lastTapTimeRef.current < 300) {
        handleReset();
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      isDraggingRef.current = true;
      touchStartRef.current = {
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      lastTouchDistRef.current = getTouchDistance(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDraggingRef.current) {
      const newPos = {
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y,
      };
      positionRef.current = newPos;
      setPosition(newPos);
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      if (lastTouchDistRef.current !== null) {
        const delta = dist - lastTouchDistRef.current;
        const newScale = Math.min(Math.max(scaleRef.current + delta * 0.005, 0.2), 5);
        updateTransform(newScale, positionRef.current);
      }
      lastTouchDistRef.current = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) lastTouchDistRef.current = null;
    if (e.touches.length === 0) isDraggingRef.current = false;
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "500px",
        overflow: "hidden",
        border: "1px solid var(--border-color, #444)",
        borderRadius: "8px",
        cursor: isDragging ? "grabbing" : "grab",
        background: "var(--mermaid-bg, #1e1e1e)",
        touchAction: "none",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Controls */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          display: "flex",
          gap: "6px",
        }}
      >
        <button
          onClick={() => updateTransform(Math.min(scaleRef.current + 0.2, 5), positionRef.current)}
          style={btnStyle}
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => updateTransform(Math.max(scaleRef.current - 0.2, 0.2), positionRef.current)}
          style={btnStyle}
          title="Zoom out"
        >
          −
        </button>
        <button onClick={handleReset} style={btnStyle} title="Reset">
          ↺
        </button>
      </div>

      {/* Scale indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          zIndex: 10,
          fontSize: "11px",
          color: "var(--text-muted, #888)",
          userSelect: "none",
        }}
      >
        {Math.round(scale * 100)}%
      </div>

      {/* Hint */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          zIndex: 10,
          fontSize: "11px",
          color: "var(--text-muted, #666)",
          userSelect: "none",
        }}
      >
        Pinch: zoom | Drag: pan | Double tap: reset
      </div>

      {/* Diagram */}
      <div
        ref={diagramRef}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "4px",
  border: "1px solid var(--border-color, #555)",
  background: "var(--btn-bg, #2a2a2a)",
  color: "var(--text-color, #ccc)",
  cursor: "pointer",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

export default MermaidDiagram;