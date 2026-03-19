import { AppHeader } from "@/components/layout/AppHeader";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Terms of Service</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing or using STEMCoach ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p>STEMCoach is an online educational platform providing practice questions, mock exams, STEMcoach coaching, flashcards, and progress tracking across multiple curricula and subjects. The Platform is available via web browser.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>Users under 13 must have parental consent to use the Platform.</li>
              <li>One active session per account is enforced for security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Subscription & Payments</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Free tier users are limited to 5 practice questions per day.</li>
              <li>Paid subscriptions (Pro, School) are billed monthly via Stripe.</li>
              <li>You may cancel at any time through the subscription management portal.</li>
              <li>Refunds are handled on a case-by-case basis within 14 days of purchase.</li>
              <li>Prices vary by region and are displayed in local currency.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Share your account credentials with others.</li>
              <li>Attempt to scrape, copy, or redistribute question content.</li>
              <li>Use automated tools to access the Platform beyond normal usage.</li>
              <li>Upload harmful, offensive, or illegal content via any user input.</li>
              <li>Attempt to circumvent subscription limits or security measures.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
            <p>All questions, explanations, worked solutions, and AI-generated content on the Platform are the intellectual property of STEMCoach. You may not reproduce, distribute, or commercially exploit this content without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. AI-Generated Content</h2>
            <p>Some content on the Platform is generated or graded using AI. While we strive for accuracy, AI-generated content may contain errors. We recommend cross-referencing with official textbooks and mark schemes for critical exam preparation.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Institution Accounts</h2>
            <p>Schools and institutions using the School plan are subject to additional terms:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tenant administrators are responsible for managing student access.</li>
              <li>White-labeling is permitted within the scope of the subscription.</li>
              <li>Student data remains subject to our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
            <p>STEMCoach is provided "as is" without warranties. We are not liable for exam results, academic outcomes, or any indirect damages arising from use of the Platform. Our total liability is limited to the amount you paid in the 12 months preceding any claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Termination</h2>
            <p>We may suspend or terminate your account if you violate these terms. You may delete your account at any time via Settings, which will permanently remove all your data in accordance with GDPR.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:legal@stemcoach.app" className="text-primary hover:underline">legal@stemcoach.app</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
