import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Subjects", to: "/subjects" },
    { label: "Mock Exams", to: "/mock-exam" },
    { label: "STEMcoach", to: "/ai-tutor" },
    { label: "Pricing", to: "/pricing" },
    { label: "Install App", to: "/install" },
  ],
  Resources: [
    { label: "Formula Sheets", to: "/formulas" },
    { label: "Blog", to: "/blog" },
    { label: "Meet the Squad", to: "/meet-the-squad" },
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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
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
              The virtual tuition centre helping students ace STEM exams worldwide with expert-crafted practice and step-by-step solutions.
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
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} STEMCoach — Virtual Tuition Centre. Made with
            <Heart className="h-3 w-3 text-destructive fill-destructive" />
            for students everywhere.
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
