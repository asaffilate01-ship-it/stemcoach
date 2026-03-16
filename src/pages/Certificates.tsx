import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

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

  const downloadPDF = (cert: Certificate) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Border
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.rect(8, 8, w - 16, h - 16);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, w - 24, h - 24);

    // Header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("CERTIFICATE OF ACHIEVEMENT", w / 2, 35, { align: "center" });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(30, 58, 95);
    doc.text("STEMCoach", w / 2, 52, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("Science, Technology, Engineering & Mathematics", w / 2, 60, { align: "center" });

    // Divider
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(w / 2 - 40, 67, w / 2 + 40, 67);

    // Cert title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text(cert.title, w / 2, 82, { align: "center", maxWidth: w - 60 });

    // Score
    if (cert.score_percent !== null) {
      doc.setFontSize(40);
      doc.setTextColor(37, 99, 235);
      doc.text(`${cert.score_percent}%`, w / 2, 105, { align: "center" });
    }

    // Subject
    if (cert.subject) {
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text(`Subject: ${cert.subject}`, w / 2, 118, { align: "center" });
    }

    // Date and verification
    const dateStr = new Date(cert.issued_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Issued: ${dateStr}`, 25, h - 25);
    doc.text(`Verification: ${cert.verification_code}`, w - 25, h - 25, { align: "right" });

    // QR-like verification box
    doc.setFillColor(241, 245, 249);
    const vText = `stemcoach.app/verify/${cert.verification_code}`;
    const vWidth = doc.getTextWidth(vText) + 12;
    doc.roundedRect(w / 2 - vWidth / 2, h - 38, vWidth, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(vText, w / 2, h - 33, { align: "center" });

    doc.save(`certificate-${cert.verification_code}.pdf`);
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
                <Button size="sm" variant="outline" onClick={() => downloadPDF(cert)} className="gap-1.5 rounded">
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
