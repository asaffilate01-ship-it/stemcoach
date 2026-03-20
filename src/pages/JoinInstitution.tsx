import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Building2, ArrowRight, Search, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinInstitution() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [found, setFound] = useState<{ id: string; name: string; logo_url: string | null } | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  const handleSearch = async () => {
    if (!slug.trim()) return;
    setLoading(true);
    setFound(null);
    setSearchDone(false);

    try {
      // Look up tenant by slug (public lookup via RLS — user must be authenticated)
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, logo_url")
        .eq("slug", slug.trim().toLowerCase())
        .maybeSingle();

      // If RLS blocks it (user not a member), try a different approach
      // We'll allow search by creating a lookup function or just attempt to join
      if (data) {
        setFound(data);
      }
      setSearchDone(true);
    } catch {
      setSearchDone(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      // Try to find tenant by slug even if RLS blocks SELECT
      // We insert a pending membership — RLS allows INSERT with status='pending'
      let tenantId = found?.id;

      if (!tenantId) {
        // Direct join attempt: look up by slug using a broad approach
        toast({ title: "Institution not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("tenant_members")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === "approved") {
          toast({ title: "You're already a member!", description: "Redirecting to your institution portal." });
          navigate("/institution");
        } else {
          toast({ title: "Request already pending", description: "An admin needs to approve your membership." });
        }
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("tenant_members")
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          role: "student",
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Join request sent! 📩",
        description: "An institution admin will review and approve your request.",
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Failed to join", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="stem-heading mb-2 text-3xl">Join an Institution</h1>
            <p className="mb-8 text-muted-foreground">
              Enter your institution's code to request access to their branded portal.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="stem-card space-y-5 rounded-xl p-6"
          >
            <div>
              <Label className="text-sm font-medium">Institution Code / Slug</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setSearchDone(false);
                    setFound(null);
                  }}
                  placeholder="e.g. westminster-academy"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={loading || !slug.trim()}
                  className="shrink-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ask your institution admin for this code
              </p>
            </div>

            {searchDone && !found && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
                <p className="text-sm text-destructive">No institution found with that code.</p>
                <p className="mt-1 text-xs text-muted-foreground">Check the code and try again.</p>
              </div>
            )}

            {found && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-primary/20 bg-primary/5 p-4"
              >
                <div className="flex items-center gap-3">
                  {found.logo_url ? (
                    <img src={found.logo_url} alt={found.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{found.name}</p>
                    <p className="text-xs text-muted-foreground">Institution found ✓</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!user && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  You'll need to{" "}
                  <button type="button" onClick={() => navigate("/auth")} className="font-semibold text-primary underline">
                    sign in
                  </button>{" "}
                  first
                </p>
              </div>
            )}

            <Button
              onClick={handleJoin}
              variant="premium"
              className="w-full gap-2"
              disabled={loading || !found || !user}
            >
              {loading ? "Joining…" : "Request to Join"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/register-institution")}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Want to register your own institution instead?
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
