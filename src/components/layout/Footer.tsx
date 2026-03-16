import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} STEMCoach — Virtual Tuition Centre
          </div>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <a href="mailto:support@stemcoach.app" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
