import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, User, GraduationCap } from "lucide-react";

type Role = "student" | "teacher" | "parent";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, requested_role: role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        
        // If auto-confirmed (dev mode), create profile & role immediately
        if (signUpData?.user && !signUpData.user.identities?.length) {
          toast({
            title: "Check your email",
            description: "We've sent you a verification link to confirm your account.",
          });
        } else if (signUpData?.user) {
          // User was auto-confirmed, seed profile + role
          await supabase.from("profiles").upsert({
            user_id: signUpData.user.id,
            display_name: displayName || email,
          });
          const assignRole = role === "teacher" || role === "parent" ? role : "student";
          await supabase.from("user_roles").upsert({
            user_id: signUpData.user.id,
            role: assignRole,
          });
          await supabase.from("user_stats").upsert({ user_id: signUpData.user.id });
          navigate("/onboarding");
          return;
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a verification link to confirm your account.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Check role and onboarding status, then redirect
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check onboarding
          const { data: prefs } = await supabase
            .from("user_preferences")
            .select("onboarding_complete")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!prefs?.onboarding_complete) {
            navigate("/onboarding");
            return;
          }

          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

          const userRole = roles?.[0]?.role;
          if (userRole === "teacher") navigate("/teacher");
          else if (userRole === "parent") navigate("/parent");
          else navigate("/subjects");
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="stem-heading text-3xl">STEMCoach</h1>
          <p className="mt-2 text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        <div className="stem-card rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">I am a...</Label>
                  <div className="mt-1.5 flex gap-2">
                    {([
                      { key: "student" as Role, label: "Student", icon: "📚" },
                      { key: "teacher" as Role, label: "Teacher", icon: "👩‍🏫" },
                      { key: "parent" as Role, label: "Parent", icon: "👨‍👩‍👧" },
                    ]).map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          role === r.key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span>{r.icon}</span> {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) { toast({ title: "Enter your email first", variant: "destructive" }); return; }
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
                      else { toast({ title: "Check your email", description: "Password reset link sent." }); }
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" minLength={6} required />
              </div>
            </div>
            <Button type="submit" className="w-full rounded" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-primary hover:underline">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
