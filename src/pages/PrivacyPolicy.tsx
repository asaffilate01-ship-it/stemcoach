import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Shield, Download, Trash2, FileText, Lock, Eye, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const rights = [
  { icon: Eye, title: "Right of Access", desc: "Request a copy of all personal data we hold about you." },
  { icon: FileText, title: "Right to Rectification", desc: "Correct any inaccurate personal data via your Settings page." },
  { icon: Trash2, title: "Right to Erasure", desc: "Permanently delete your account and all associated data." },
  { icon: Download, title: "Right to Portability", desc: "Export your data in JSON format at any time." },
  { icon: Lock, title: "Right to Restrict", desc: "Request restriction of processing in certain circumstances." },
  { icon: Database, title: "Right to Object", desc: "Opt out of data processing for marketing or profiling." },
];

export default function PrivacyPolicy() {
  useDocumentTitle("Privacy Policy");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return navigate("/auth");
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stemcoach-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Shield className="h-3.5 w-3.5" /> GDPR Compliant
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-muted-foreground">Last updated: March 2026</p>
          </motion.div>

          {/* GDPR Rights Action Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8"
          >
            <h2 className="mb-2 text-lg font-bold">Your Data Rights</h2>
            <p className="mb-6 text-sm text-muted-foreground">Under GDPR and applicable data protection laws, you have the following rights:</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rights.map((r) => (
                <div key={r.title} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/80 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <r.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="sm" variant="outline" className="gap-2 rounded-lg" onClick={handleExport} disabled={exporting}>
                <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting…" : "Export My Data"}
              </Button>
              <Button size="sm" variant="outline" className="gap-2 rounded-lg text-destructive hover:text-destructive" onClick={() => navigate("/settings")}>
                <Trash2 className="h-3.5 w-3.5" /> Delete My Account
              </Button>
            </div>
          </motion.div>

          {/* Policy Sections */}
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold">1. Data We Collect</h2>
              <p>We collect the following personal data when you use STEMCoach:</p>
              <ul>
                <li><strong>Account information</strong>: Email address, display name, and password (hashed)</li>
                <li><strong>Learning data</strong>: Answers to questions, scores, study time, and progress metrics</li>
                <li><strong>Device information</strong>: Browser type and session identifiers for security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">2. How We Use Your Data</h2>
              <ul>
                <li>To provide personalised learning recommendations and track progress</li>
                <li>To generate analytics and identify weak topics for targeted revision</li>
                <li>To enforce single-session security policies</li>
                <li>To communicate important updates about your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">3. Legal Basis (GDPR Article 6)</h2>
              <p>We process your data under the following legal bases:</p>
              <ul>
                <li><strong>Contract (Art. 6(1)(b))</strong>: To provide the educational services you signed up for</li>
                <li><strong>Legitimate interest (Art. 6(1)(f))</strong>: To improve our platform and prevent fraud</li>
                <li><strong>Consent (Art. 6(1)(a))</strong>: For optional analytics cookies and marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">4. Data Retention</h2>
              <p>We retain your data for as long as your account is active. You may request deletion at any time via the Settings page. Upon deletion, all personal data is permanently removed within 30 days.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">5. International Transfers</h2>
              <p>Your data is processed within the EU/EEA. Where transfers outside this area occur (e.g., Stripe payments), they are protected by Standard Contractual Clauses (SCCs) or equivalent safeguards.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">6. Cookies</h2>
              <p>We use the following categories of cookies:</p>
              <ul>
                <li><strong>Essential</strong>: Authentication tokens and session management (always active)</li>
                <li><strong>Functional</strong>: User preferences such as theme and layout settings</li>
                <li><strong>Analytics</strong>: Anonymous usage insights (opt-in only via cookie banner)</li>
              </ul>
              <p>No third-party advertising or tracking cookies are used. You can manage preferences at any time via the cookie consent banner.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">7. Children's Data (Under 16)</h2>
              <p>STEMCoach is designed for students. Where users are under 16, we require parental consent via our Parent Dashboard linking system. Parents can monitor and manage their child's data at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">8. Third-Party Processors</h2>
              <ul>
                <li><strong>Stripe</strong>: Payment processing (PCI DSS compliant)</li>
                <li><strong>Jitsi</strong>: Video conferencing for live classrooms</li>
              </ul>
              <p>We do not sell your data to any third party.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">9. Data Protection Officer</h2>
              <p>For data protection inquiries or to exercise your rights, contact our DPO: <a href="mailto:privacy@stemcoach.app" className="text-primary">privacy@stemcoach.app</a></p>
              <p>You also have the right to lodge a complaint with your local supervisory authority (e.g., the ICO in the UK).</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
