import React from "react";
import "../styles/theme.css";

type Props = {
  context?: "home" | "place";
};

const STORAGE_KEY = "midlo-open-in-app-banner-dismissed";

function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export default function OpenInAppBanner({ context = "home" }: Props) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed === "1") return;

    const mobile = isMobileUserAgent();
    if (!mobile) return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleOpen = () => {
    // For now, send to the main site / store page.
    // Later, this can be upgraded to a deep link (midlo://) + store fallback.
    window.open("https://midlo.app", "_blank");
  };

  const label =
    context === "place"
      ? "Get the Midlo app for richer place details and faster directions."
      : "Get the Midlo app for a smoother, faster midpoint experience.";

  return (
    <div
      style={{
        marginBottom: 12,
        padding: 10,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-accent)",
        backgroundColor: "rgba(232,245,233,0.9)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          flex: 1,
          fontSize: "var(--font-size-caption)",
          color: "var(--color-primary-dark)",
        }}
      >
        {label}
      </div>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          padding: "6px 10px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--color-primary)",
          backgroundColor: "var(--color-bright)",
          color: "var(--color-surface)",
          cursor: "pointer",
          fontSize: "var(--font-size-caption)",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        Open app
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          padding: 4,
          borderRadius: "var(--radius-pill)",
          border: "none",
          background: "transparent",
          color: "var(--color-muted)",
          cursor: "pointer",
          fontSize: "var(--font-size-caption)",
        }}
      >
        ✕
      </button>
    </div>
  );
}
