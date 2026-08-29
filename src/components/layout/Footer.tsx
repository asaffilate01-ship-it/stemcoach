import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";
import { openCookieSettings } from "@/lib/cookieConsent";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    [t("footer.product")]: [
      { label: t("footer.subjects"), to: "/subjects" },
      { label: t("footer.mockExams"), to: "/mock-exam" },
      { label: t("footer.stemcoach"), to: "/ai-tutor" },
      { label: t("footer.pricing"), to: "/pricing" },
      { label: t("footer.installApp"), to: "/install" },
    ],
    [t("footer.resources")]: [
      { label: t("footer.formulaSheets"), to: "/formulas" },
      { label: t("footer.blog"), to: "/blog" },
      { label: t("footer.tutorials"), to: "/tutorials" },
      { label: t("footer.meetTheSquad"), to: "/meet-the-squad" },
    ],
    [t("footer.company")]: [
      { label: t("footer.support"), to: "/support" },
      { label: t("footer.privacyPolicy"), to: "/privacy" },
      { label: t("footer.termsOfService"), to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: t("footer.emailUs"), to: "mailto:support@stemcoach.app", external: true },
    ],
  };

  return (
    <footer className="hidden border-t border-border/30 bg-muted/10 py-14 lg:block">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/assets/coach-stem.png"
                alt="Coach Stem"
                className="h-9 w-9 rounded-xl object-cover shadow-md shadow-primary/20"
              />
              <span className="text-lg font-bold tracking-tight text-foreground">
                STEM<span className="text-primary">Coach</span>
              </span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              {t("footer.footerDesc")}
            </p>
            <div className="mt-6 flex items-center gap-2">
              {["/assets/mathmax.png", "/assets/physix.png", "/assets/chemi.png", "/assets/biobee.png", "/assets/codey.png", "/assets/lexi.png", "/assets/econiq.png", "/assets/litera.png", "/assets/pysche.png", "/assets/geo.png", "/assets/bizpro.png"].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-7 w-7 rounded-lg object-cover ring-1 ring-border/20 transition-transform duration-300 hover:scale-110"
                  loading="lazy"
                />
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link ? (
                      <a href={link.to} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/30 pt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              {t("footer.copyright", { year: new Date().getFullYear() })}
              <Heart className="h-3 w-3 text-destructive fill-destructive" />
              {t("footer.copyrightSuffix")}
            </p>
            <p className="text-xs text-muted-foreground/60">STEMcoach is a trading name of iTechLounge Ltd</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">{t("footer.privacy")}</Link>
            <Link to="/terms" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">{t("footer.terms")}</Link>
            <Link to="/cookies" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Cookies</Link>
            <button
              type="button"
              onClick={openCookieSettings}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Cookie settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
