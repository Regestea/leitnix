import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import nixLogo from "../../../assets/images/nix-logo.png";

interface NixButtonProps {
  onClick?: () => void;
  showRollback?: boolean;
  onRollback?: () => void;
}

export function NixButton({ onClick, showRollback, onRollback }: NixButtonProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: "0",
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
          }}
          title="Rollback to previous content"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
      )}
    </span>
  );
}
