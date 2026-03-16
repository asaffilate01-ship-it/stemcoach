import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Subjects", to: "/subjects" },
    { label: "Mock Exams", to: "/mock-exam" },
    { label: "AI Tutor", to: "/ai-tutor" },
    { label: "Pricing", to: "/pricing" },
  ],
  Company: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Contact", to: "mailto:support@stemcoach.app", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-sm font-extrabold text-primary-foreground">
                S
              </span>
              <span className="font-bold tracking-tight text-foreground">
                STEM<span className="text-primary">Coach</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
              The virtual tuition centre helping students ace STEM exams worldwide with AI-powered practice and expert solutions.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link ? (
                      <a href={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
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

        <div className="mt-10 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} STEMCoach — Virtual Tuition Centre. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
