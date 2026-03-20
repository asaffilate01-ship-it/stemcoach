import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Building2, ArrowRight, CheckCircle2, Palette, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const benefits = [
  { icon: Palette, text: "Custom branding with your logo and colours" },
  { icon: Users, text: "Manage teachers, students, and parents" },
  { icon: GraduationCap, text: "Set assignments and track progress" },
];

export default function RegisterInstitution() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const generateSlug = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!name.trim() || !slug.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create tenant
      const { data: tenant, error: tenantErr } = await supabase
        .from("tenants")
        .insert({ name: name.trim(), slug: slug.trim() })
        .select()
        .single();
      if (tenantErr) throw tenantErr;

      // Add user as admin member (approved)
      const { error: memberErr } = await supabase
        .from("tenant_members")
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: "admin",
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        });
      if (memberErr) throw memberErr;

      toast({
        title: "Institution registered! 🎉",
        description: "Welcome to your admin portal. Customise your branding to get started.",
      });
      navigate("/institution");
    } catch (err: any) {
      const msg = err?.message?.includes("unique") ? "That slug is already taken. Try a different one." : err?.message;
      toast({ title: "Registration failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="stem-heading mb-2 text-3xl">Register Your Institution</h1>
            <p className="mb-8 text-muted-foreground">
              Get a branded portal for your college, school, or tuition centre — with full class management, assignments, and parent monitoring.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold">What you get</h3>
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{b.text}</span>
                </div>
              ))}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary">Free to get started</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start with up to 50 students. Upgrade anytime for more capacity and custom domains.
                </p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="stem-card space-y-5 rounded-xl p-6"
            >
              <div>
                <Label className="text-sm font-medium">Institution Name</Label>
                <Input
                  value={name}
                  onChange={(e) => generateSlug(e.target.value)}
                  placeholder="e.g. Westminster Academy"
                  className="mt-1.5"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">URL Slug</Label>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">stemcoach.app/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="westminster-academy"
                    className="flex-1"
                    required
                    maxLength={40}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">This will be your unique institution identifier</p>
              </div>

              {!user && (
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    You'll need to <button type="button" onClick={() => navigate("/auth")} className="font-semibold text-primary underline">sign in</button> first
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="premium"
                className="w-full gap-2"
                disabled={loading || !user}
              >
                {loading ? "Registering…" : "Register Institution"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>
          </div>
        </div>
      </main>
    </div>
  );
}
