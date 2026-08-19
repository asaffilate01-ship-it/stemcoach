import { Link } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { openCookieSettings } from "@/lib/cookieConsent";

export default function CookiePolicy() {
  useDocumentTitle(
    "Cookie Policy",
    "How STEMcoach uses cookies and local storage, the categories we use, and how to change your preferences at any time."
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Cookie Policy</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <section>
            <h2 className="text-xl font-semibold">1. What we use</h2>
            <p>
              STEMcoach uses cookies and equivalent browser storage (localStorage and IndexedDB) to keep you
              signed in, remember your preferences, and understand how the platform is used. You can change
              your choices at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Categories</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Essential</strong> — authentication session tokens, security and session-integrity
                checks, and your cookie choice itself. These cannot be disabled because the platform cannot
                function without them.
              </li>
              <li>
                <strong>Functional</strong> — theme (dark/light), language, and cached subject/question data
                so pages load faster offline. Declining these means preferences reset each visit.
              </li>
              <li>
                <strong>Analytics</strong> — aggregated usage insights that help us improve lessons and
                navigation. Off unless you opt in.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Third parties</h2>
            <p>
              Payment checkout is handled by Stripe, which sets its own cookies on its hosted pages for fraud
              prevention. Our backend (authentication, database and functions) sets only essential session
              storage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Managing your choices</h2>
            <p>
              Use the button below to reopen the cookie preferences panel. Declining a category immediately
              clears the related storage on your device. You can also clear cookies in your browser settings.
            </p>
            <Button onClick={openCookieSettings} className="mt-2 rounded-lg">
              Manage cookie preferences
            </Button>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. More information</h2>
            <p>
              See our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>, or contact{" "}
              <a href="mailto:privacy@stemcoach.app" className="text-primary hover:underline">privacy@stemcoach.app</a>.
            </p>
            <p className="text-xs text-muted-foreground">STEMcoach is a trading name of iTechLounge Ltd.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
