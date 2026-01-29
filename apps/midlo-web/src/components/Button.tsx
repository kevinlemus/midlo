import React from "react";
import "../styles/theme.css";

type Variant = "primary" | "secondary";

type Props = {
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
};

export default function Button({
  title = "Button",
  onClick,
  disabled,
  variant = "primary",
}: Props) {
  const isPrimary = variant === "primary";

  const backgroundColor = disabled
    ? "var(--color-muted)"
    : isPrimary
    ? "var(--color-bright)"
    : "var(--color-surface)";

  const borderColor = isPrimary ? "transparent" : "var(--color-accent)";
  const textColor = isPrimary ? "var(--color-surface)" : "var(--color-primary-dark)";
  const boxShadow = isPrimary && !disabled ? "var(--shadow-card)" : "none";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="midlo-button"
      style={{
        width: "100%",
        padding: "12px 16px",
        backgroundColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "var(--font-size-body)",
        fontWeight: 500,
        boxShadow,
        opacity: disabled ? 0.7 : 1,
        textAlign: "center",
      }}
    >
      {title}
    </button>
  );
}
