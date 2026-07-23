import { useRef, useState, useCallback, useEffect } from "react";
import Modal from "../Modal";
import styles from "./ColorPicker.module.css";

const PRESETS = [
  "#ffffff", "#f0f0f0", "#e0e0e0", "#d0d0d0", "#c0c0c0",
  "#fff8dc", "#f5f5dc", "#fae1b0", "#f4ecd8", "#e8dcc8",
  "#1e293b", "#0f172a", "#1a1a2e", "#16213e", "#0a0a0a",
  "#ffd6d6", "#d6f5d6", "#d6e8ff", "#fff0d6", "#f0d6ff",
];

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function rgbToHsv(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb);
  const d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60;
    else if (mx === gg) h = ((bb - rr) / d + 2) * 60;
    else h = ((rr - gg) / d + 4) * 60;
  }
  const s = mx === 0 ? 0 : d / mx;
  return { h, s, v: mx };
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const svSquareRef = useRef<HTMLCanvasElement>(null);
  const hueBarRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<"sv" | "hue" | null>(null);

  const validHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  const draftValid = /^#[0-9a-fA-F]{6}$/.test(draft) ? draft : "#000000";
  const draftRgb = hexToRgb(draftValid);
  const draftHsv = rgbToHsv(draftRgb.r, draftRgb.g, draftRgb.b);

  const drawSvSquare = useCallback((h: number, s: number, v: number) => {
    const canvas = svSquareRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, hh = canvas.height;
    ctx.clearRect(0, 0, w, hh);
    const base = hsvToRgb(h, 1, 1);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, rgbToHex(base.r, base.g, base.b));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, hh);
    const grad2 = ctx.createLinearGradient(0, 0, 0, hh);
    grad2.addColorStop(0, "rgba(0,0,0,0)");
    grad2.addColorStop(1, "#000000");
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, hh);
    const px = (s / 1) * w, py = (1 - v / 1) * hh;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  const drawHueBar = useCallback((h: number) => {
    const canvas = hueBarRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, hh = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 360; i += 60) {
      const { r, g, b } = hsvToRgb(i, 1, 1);
      grad.addColorStop(i / 360, rgbToHex(r, g, b));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, hh);
    const px = (h / 360) * w;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, hh);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, hh);
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const raf = requestAnimationFrame(() => {
      drawSvSquare(draftHsv.h, draftHsv.s, draftHsv.v);
      drawHueBar(draftHsv.h);
    });
    return () => cancelAnimationFrame(raf);
  }, [modalOpen, draftHsv, drawSvSquare, drawHueBar]);

  function getSvFromEvent(clientX: number, clientY: number) {
    const canvas = svSquareRef.current;
    if (!canvas) return { s: draftHsv.s, v: draftHsv.v };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    return { s: x / rect.width, v: 1 - y / rect.height };
  }

  function getHueFromEvent(clientX: number) {
    const canvas = hueBarRef.current;
    if (!canvas) return draftHsv.h;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * 360;
  }

  function updateDraftFromSv(clientX: number, clientY: number) {
    const { s, v } = getSvFromEvent(clientX, clientY);
    const { r, g, b } = hsvToRgb(draftHsv.h, s, v);
    setDraft(rgbToHex(r, g, b));
  }

  function updateDraftFromHue(clientX: number) {
    const h = getHueFromEvent(clientX);
    const { r, g, b } = hsvToRgb(h, draftHsv.s, draftHsv.v);
    setDraft(rgbToHex(r, g, b));
  }

  function handleSvMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    dragging.current = "sv";
    updateDraftFromSv(e.clientX, e.clientY);
  }

  function handleHueMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    dragging.current = "hue";
    updateDraftFromHue(e.clientX);
  }

  useEffect(() => {
    if (!modalOpen) return;
    function handleMouseMove(e: MouseEvent) {
      if (dragging.current === "sv") updateDraftFromSv(e.clientX, e.clientY);
      else if (dragging.current === "hue") updateDraftFromHue(e.clientX);
    }
    function handleMouseUp() { dragging.current = null; }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  function openModal() {
    setDraft(value);
    setModalOpen(true);
  }

  function handleConfirm() {
    if (/^#[0-9a-fA-F]{6}$/.test(draft)) {
      onChange(draft);
    } else {
      onChange("#000000");
    }
    setModalOpen(false);
  }

  function handleCancel() {
    setDraft(value);
    setModalOpen(false);
  }

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;
    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
      setDraft(val);
    }
  }

  function handleHexBlur() {
    if (!/^#[0-9a-fA-F]{6}$/.test(draft)) {
      setDraft("#000000");
    }
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.swatch}
          style={{ backgroundColor: validHex }}
          onClick={openModal}
          title="Click to open color picker"
        />
        <input
          type="text"
          className={styles.hexInput}
          value={value}
          readOnly
          onClick={openModal}
          placeholder="#000000"
          maxLength={7}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={`Pick ${label.toLowerCase()}`}
        size="sm"
        bodyClassName={styles.modalBody}
      >
        <div className={styles.pickerArea}>
          <canvas
            ref={svSquareRef}
            width={240}
            height={180}
            className={styles.svSquare}
            onMouseDown={handleSvMouseDown}
          />
          <canvas
            ref={hueBarRef}
            width={240}
            height={16}
            className={styles.hueBar}
            onMouseDown={handleHueMouseDown}
          />
          <div className={styles.previewRow}>
            <div className={styles.preview} style={{ backgroundColor: draftValid }} />
            <input
              type="text"
              className={styles.hexInput}
              value={draft}
              onChange={handleHexChange}
              onBlur={handleHexBlur}
              placeholder="#000000"
              maxLength={7}
            />
            <span className={styles.rgbLabel}>
              RGB({draftRgb.r}, {draftRgb.g}, {draftRgb.b})
            </span>
          </div>
          <div className={styles.presets}>
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.preset}${c === draft ? ` ${styles.presetActive}` : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setDraft(c)}
                title={c}
              />
            ))}
          </div>
          <div className={styles.actionRow}>
            <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
              Apply
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
