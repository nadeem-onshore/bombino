import { Link } from "wouter";
import { Sparkles } from "lucide-react";

export function SupportFab() {
  return (
    <div
      className="fab-wrapper"
      style={{ bottom: "calc(4rem - 16px)" }}
    >
      <div className="fab-aura" aria-hidden />
      <Link
        href="/help"
        className="fab-button"
        aria-label="Open Support Assistant"
        data-testid="fab-support"
      >
        <span className="fab-icon-wrap">
          <Sparkles className="h-7 w-7" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </div>
  );
}
