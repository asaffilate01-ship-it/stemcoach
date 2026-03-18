import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Mail, Lock, User, ArrowRight, Sparkles, GraduationCap, Users, Eye } from "lucide-react";

type Role = "student" | "teacher" | "parent";

const roleOptions: { key: Role; label: string; icon: typeof GraduationCap; desc: string }[] = [
  { key: "student", label: "Student", icon: GraduationCap, desc: "Practice & learn" },
  { key: "teacher", label: "Teacher", icon: Users, desc: "Manage classes" },
  { key: "parent", label: "Parent", icon: Eye, desc: "Monitor progress" },
];

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const seedUserData = async (userId: string, name: string) => {
    // Only create profile and student role — admin must manually assign teacher/parent/admin roles
    await supabase.from("profiles").upsert({ user_id: userId, display_name: name || email }, { onConflict: "user_id" });
    await supabase.from("user_roles").upsert({ user_id: userId, role: "student" }, { onConflict: "user_id,role" });
    await supabase.from("user_stats").upsert({ user_id: userId }, { onConflict: "user_id" });
  };

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

        if (signUpData?.user && signUpData.session) {
          await seedUserData(signUpData.user.id, displayName, role);
          navigate("/onboarding");
          return;
        }

        toast({
          title: "Check your email",
          description: "We've sent you a verification link to confirm your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Login failed");

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const meta = user.user_metadata || {};
          await seedUserData(user.id, meta.display_name || user.email || "", meta.requested_role || "student");
        }

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
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/40 to-transparent" />
        
        <div className="relative z-10 max-w-md px-12 text-primary-foreground">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/20 text-lg font-extrabold backdrop-blur-sm">
                S
              </span>
              <span className="text-2xl font-bold tracking-tight">
                STEM<span className="opacity-80">Coach</span>
              </span>
            </div>
            
            <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight">
              Your private tutor,
              <br />
              always available.
            </h2>
            <p className="mb-10 text-base leading-relaxed opacity-80">
              1,000,000+ exam-style questions, AI coaching, and real exam simulations across 30+ curricula worldwide.
            </p>
            
            <div className="space-y-4">
              {[
                { stat: "1M+", label: "Practice Questions" },
                { stat: "30+", label: "Curricula Supported" },
                { stat: "94%", label: "Student Pass Rate" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-2xl font-extrabold">{item.stat}</span>
                  <span className="text-sm opacity-70">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/25">
              S
            </div>
            <h1 className="stem-heading text-3xl">STEMCoach</h1>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp ? "Start your exam preparation journey" : "Sign in to continue learning"}
            </p>
          </div>

          <div className="stem-card rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                      <div className="relative mt-1.5">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="rounded-xl pl-10" required />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">I am a…</Label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {roleOptions.map((r) => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => setRole(r.key)}
                            className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                              role === r.key
                                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                                : "border-transparent bg-muted/30 hover:border-primary/20"
                            }`}
                          >
                            <r.icon className={`h-5 w-5 transition-colors ${role === r.key ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                            <span className="text-xs font-semibold">{r.label}</span>
                            <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="rounded-xl pl-10" required />
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
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl pl-10" minLength={6} required />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2 rounded-xl text-base shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? "Please wait…" : isSignUp ? (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-primary hover:underline">
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and{" "}
            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
