import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { motion } from "framer-motion";
import { Shield, Cookie, FileText, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
        
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
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
            <h2 className="text-xl font-semibold">3. Legal Basis (GDPR)</h2>
            <p>We process your data under the following legal bases:</p>
            <ul>
              <li><strong>Contract</strong>: To provide the educational services you signed up for</li>
              <li><strong>Legitimate interest</strong>: To improve our platform and prevent fraud</li>
              <li><strong>Consent</strong>: For optional analytics and marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion at any time via the Settings page. Upon deletion, all personal data is permanently removed within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Your Rights</h2>
            <p>Under GDPR and applicable data protection laws, you have the right to:</p>
            <ul>
              <li><strong>Access</strong>: Request a copy of your personal data</li>
              <li><strong>Rectification</strong>: Correct inaccurate data</li>
              <li><strong>Erasure</strong>: Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Portability</strong>: Export your data in a machine-readable format</li>
              <li><strong>Objection</strong>: Opt out of data processing for certain purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used. You can manage cookie preferences via the cookie consent banner.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Third Parties</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Stripe</strong>: Payment processing (PCI DSS compliant)</li>
              <li><strong>Jitsi</strong>: Video conferencing for live classrooms</li>
            </ul>
            <p>We do not sell your data to any third party.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p>For data protection inquiries, contact: <a href="mailto:privacy@stemcoach.app" className="text-primary">privacy@stemcoach.app</a></p>
          </section>

          <p className="text-xs text-muted-foreground">Last updated: March 2026</p>
        </div>
      </main>
    </div>
  );
}
