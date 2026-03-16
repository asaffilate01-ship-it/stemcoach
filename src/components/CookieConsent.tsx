import { useState, useEffect } from "react";
import { Cookie, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "stemcoach_cookie_consent";

interface CookiePrefs {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

const defaultPrefs: CookiePrefs = {
  essential: true,
  functional: false,
  analytics: false,
};

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(defaultPrefs);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setShow(true);
  }, []);

  const save = (overridePrefs?: CookiePrefs) => {
    const finalPrefs = overridePrefs || prefs;
    localStorage.setItem(CONSENT_KEY, JSON.stringify(finalPrefs));
    setShow(false);
  };

  const acceptAll = () => save({ essential: true, functional: true, analytics: true });
  const rejectAll = () => save({ essential: true, functional: false, analytics: false });

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md shadow-2xl"
      >
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3 max-w-2xl">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Cookie className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">We respect your privacy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies for authentication and to improve your experience. No tracking cookies are used without your consent.{" "}
                  <a href="/privacy" className="text-primary underline hover:text-primary/80 transition-colors">Privacy Policy</a>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="gap-1 text-xs text-muted-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
                Customise
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button size="sm" variant="outline" onClick={rejectAll} className="rounded-lg text-xs">
                Reject All
              </Button>
              <Button size="sm" onClick={acceptAll} className="rounded-lg text-xs shadow-sm shadow-primary/20">
                Accept All
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid gap-3 border-t border-border/50 pt-4 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">Essential</p>
                      <p className="text-[10px] text-muted-foreground">Auth & security</p>
                    </div>
                    <Switch checked disabled className="opacity-50" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">Functional</p>
                      <p className="text-[10px] text-muted-foreground">Preferences & layout</p>
                    </div>
                    <Switch
                      checked={prefs.functional}
                      onCheckedChange={(v) => setPrefs({ ...prefs, functional: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">Analytics</p>
                      <p className="text-[10px] text-muted-foreground">Usage insights</p>
                    </div>
                    <Switch
                      checked={prefs.analytics}
                      onCheckedChange={(v) => setPrefs({ ...prefs, analytics: v })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => save()} className="rounded-lg text-xs">
                    Save Preferences
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
