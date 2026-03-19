import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Subjects", to: "/subjects" },
    { label: "Mock Exams", to: "/mock-exam" },
    { label: "STEMcoach", to: "/ai-tutor" },
    { label: "Pricing", to: "/pricing" },
    { label: "Install App", to: "/install" },
  ],
  Company: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Contact", to: "mailto:support@stemcoach.app", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="hidden border-t border-border/30 bg-muted/10 py-14 lg:block">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(258_60%_52%)] text-sm font-extrabold text-white shadow-md shadow-primary/20">
                S
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                STEM<span className="text-primary">Coach</span>
              </span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              The virtual tuition centre helping students ace STEM exams worldwide with AI-powered practice and expert-crafted solutions.
            </p>
          </div>

          {/* Links */}
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
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} STEMCoach — Virtual Tuition Centre. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
