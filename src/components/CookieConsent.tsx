import { useState, useEffect, useCallback } from "react";
import { Cookie, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  CONSENT_OPEN_EVENT,
  getConsent,
  initConsent,
  saveConsent,
} from "@/lib/cookieConsent";

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    initConsent();
    const existing = getConsent();
    if (!existing) {
      setShow(true);
    } else {
      setFunctional(existing.functional);
      setAnalytics(existing.analytics);
    }

    const onOpen = () => {
      const current = getConsent();
      setFunctional(current?.functional ?? false);
      setAnalytics(current?.analytics ?? false);
      setExpanded(true);
      setShow(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  const save = useCallback((prefs: { functional: boolean; analytics: boolean }) => {
    saveConsent(prefs);
    setFunctional(prefs.functional);
    setAnalytics(prefs.analytics);
    setExpanded(false);
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-label="Cookie preferences"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="safe-area-bottom fixed bottom-0 left-0 right-0 z-[60] border-t border-border/50 bg-background/95 backdrop-blur-md shadow-2xl"
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
                  We use essential cookies to keep you signed in and secure. Functional and analytics
                  storage are only used with your consent.{" "}
                  <a href="/cookies" className="text-primary underline hover:text-primary/80 transition-colors">Cookie Policy</a>
                  {" · "}
                  <a href="/privacy" className="text-primary underline hover:text-primary/80 transition-colors">Privacy Policy</a>
                  {" · "}
                  <a href="/terms" className="text-primary underline hover:text-primary/80 transition-colors">Terms</a>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="gap-1 text-xs text-muted-foreground"
                aria-expanded={expanded}
              >
                <Settings className="h-3.5 w-3.5" />
                Customise
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => save({ functional: false, analytics: false })}
                className="rounded-lg text-xs"
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={() => save({ functional: true, analytics: true })}
                className="rounded-lg text-xs shadow-sm shadow-primary/20"
              >
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
                      <p className="text-[10px] text-muted-foreground">Auth &amp; security</p>
                    </div>
                    <Switch checked disabled aria-label="Essential cookies always on" className="opacity-50" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">Functional</p>
                      <p className="text-[10px] text-muted-foreground">Preferences &amp; layout</p>
                    </div>
                    <Switch checked={functional} onCheckedChange={setFunctional} aria-label="Functional cookies" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">Analytics</p>
                      <p className="text-[10px] text-muted-foreground">Usage insights</p>
                    </div>
                    <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => save({ functional, analytics })} className="rounded-lg text-xs">
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
