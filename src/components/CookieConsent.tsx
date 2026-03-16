import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "stemcoach_cookie_consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <Cookie className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            We use essential cookies for authentication and session management. No tracking cookies are used.{" "}
            <a href="/privacy" className="text-primary underline">Privacy Policy</a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={decline} className="rounded">
            Decline
          </Button>
          <Button size="sm" onClick={accept} className="rounded">
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
