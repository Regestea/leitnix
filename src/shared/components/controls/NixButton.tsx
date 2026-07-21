import nixLogo from "../../../assets/images/nix-logo.png";

interface NixButtonProps {
  onClick?: () => void;
}

export function NixButton({ onClick }: NixButtonProps) {
  return (
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
  );
}
