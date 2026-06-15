import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

const CONSENT_KEY = "saanjh_cookie_consent";

type CookieChoice = "all" | "essential";

interface CookieConsent {
  choice: CookieChoice;
  timestamp: number;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) {
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
      const consent: CookieConsent = JSON.parse(raw);
      // Re-ask if consent is older than 365 days
      const ageMs = Date.now() - consent.timestamp;
      if (ageMs > 365 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(CONSENT_KEY);
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = (choice: CookieChoice) => {
    const consent: CookieConsent = { choice, timestamp: Date.now() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[999] bg-background border-t border-border shadow-soft animate-in slide-in-from-bottom duration-500"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">

        {/* Icon + Message */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-gold text-gold font-bold text-xs mt-0.5 select-none">
            i
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This site uses cookies. Visit our{" "}
            <Link
              to="/help"
              className="text-foreground underline underline-offset-2 hover:text-gold transition-colors font-medium"
            >
              cookies policy page
            </Link>{" "}
            or click the link in any footer for more information and to change your preferences.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => accept("all")}
            className="bg-foreground text-background font-medium text-xs px-4 py-2.5 rounded hover:bg-foreground/90 transition-colors cursor-pointer whitespace-nowrap tracking-wide"
          >
            Accept all cookies
          </button>
          <button
            onClick={() => accept("essential")}
            className="border border-border bg-background text-foreground font-medium text-xs px-4 py-2.5 rounded hover:border-foreground transition-colors cursor-pointer whitespace-nowrap tracking-wide"
          >
            Accept only essential cookies
          </button>
          <button
            onClick={() => accept("essential")}
            aria-label="Dismiss"
            className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

