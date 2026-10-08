import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import nixLogo from "../../../assets/images/nix-logo.png";

interface NixButtonProps {
  onClick?: () => void;
  showRollback?: boolean;
  onRollback?: () => void;
  className?: string;
  style?: CSSProperties;
  rollbackStyle?: CSSProperties;
}

export function NixButton({ onClick, showRollback, onRollback, className, style, rollbackStyle }: NixButtonProps) {
  return (
    <>
      <button
        onClick={onClick}
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: "0",
          ...style,
        }}
      >
        <img style={{ display: "block", maxHeight: "30px" }} src={nixLogo} alt="Nix" />
      </button>
      {showRollback && (
        <button
          onClick={onRollback}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            padding: "0.25rem",
            background: "none",
            ...rollbackStyle,
          }}
          title="Rollback to previous content"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
      )}
    </>
  );
}
