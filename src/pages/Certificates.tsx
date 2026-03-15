import { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Certificate {
  id: string;
  title: string;
  subject: string | null;
  achievement_type: string;
  score_percent: number | null;
  verification_code: string;
  issued_at: string;
}

export default function Certificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false })
      .then(({ data }) => setCerts(data || []));
  }, [user]);

  const handleDownload = (cert: Certificate) => {
    // Generate a printable certificate in a new tab
    const html = `
<!DOCTYPE html>
<html><head><title>Certificate - ${cert.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
  * { margin: 0; box-sizing: border-box; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f0f4f8; font-family: Inter, sans-serif; }
  .cert { width: 800px; padding: 60px; background: white; border: 3px solid #2563eb; position: relative; text-align: center; }
  .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid #93c5fd; pointer-events: none; }
  .cert h1 { font-family: 'Playfair Display', serif; font-size: 36px; color: #1e3a5f; margin-bottom: 8px; }
  .cert .sub { color: #64748b; font-size: 14px; margin-bottom: 32px; }
  .cert .awarded { font-size: 12px; text-transform: uppercase; letter-spacing: 4px; color: #94a3b8; margin-bottom: 16px; }
  .cert .name { font-size: 28px; font-weight: 700; color: #1e40af; border-bottom: 2px solid #2563eb; display: inline-block; padding-bottom: 4px; margin-bottom: 16px; }
  .cert .desc { color: #475569; font-size: 16px; margin-bottom: 24px; line-height: 1.6; }
  .cert .score { font-size: 48px; font-weight: 700; color: #2563eb; margin-bottom: 8px; }
  .cert .meta { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; color: #94a3b8; }
  .cert .verify { background: #f1f5f9; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 13px; display: inline-block; margin-top: 16px; }
  @media print { body { background: white; } .cert { border: 3px solid #2563eb; } }
</style></head><body>
<div class="cert">
  <div class="awarded">Certificate of Achievement</div>
  <h1>STEMCoach</h1>
  <div class="sub">Science, Technology, Engineering & Mathematics</div>
  <div class="desc">${cert.title}</div>
  ${cert.score_percent !== null ? `<div class="score">${cert.score_percent}%</div>` : ''}
  ${cert.subject ? `<div class="desc">Subject: ${cert.subject}</div>` : ''}
  <div class="meta">
    <span>Issued: ${new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    <span>ID: ${cert.verification_code}</span>
  </div>
  <div class="verify">Verify at stemcoach.app/verify/${cert.verification_code}</div>
</div>
<script>window.print();</script>
</body></html>`;

    const w = window.open("", "_blank");
    w?.document.write(html);
    w?.document.close();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <div className="stem-label mb-2">Recognition</div>
          <h1 className="stem-heading text-3xl">Your Certificates</h1>
        </div>

        {certs.length === 0 ? (
          <div className="stem-card rounded-xl p-12 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold">No certificates yet</h3>
            <p className="text-sm text-muted-foreground">
              Complete subjects, ace mock exams, or earn badge milestones to receive certificates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {certs.map((cert, i) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="stem-card flex items-center gap-4 rounded-xl p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">{cert.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {cert.subject && `${cert.subject} · `}
                    {new Date(cert.issued_at).toLocaleDateString()}
                    {cert.score_percent !== null && ` · ${cert.score_percent}%`}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    ID: {cert.verification_code}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownload(cert)} className="gap-1.5 rounded">
                  <Download className="h-3.5 w-3.5" />
                  Print
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
