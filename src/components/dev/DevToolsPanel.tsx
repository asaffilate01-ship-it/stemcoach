import { useState } from "react";
import { Bug, X, LogIn, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const DEV_ACCOUNTS = [
  { label: "Student", email: "dev-student@stemcoach.test", password: "DevStudent123!", role: "student", emoji: "📚" },
  { label: "Teacher", email: "dev-teacher@stemcoach.test", password: "DevTeacher123!", role: "teacher", emoji: "👩‍🏫" },
  { label: "Parent", email: "dev-parent@stemcoach.test", password: "DevParent123!", role: "parent", emoji: "👨‍👩‍👧" },
  { label: "Admin", email: "dev-admin@stemcoach.test", password: "DevAdmin123!", role: "admin", emoji: "🛡️" },
];

// Temporarily enabled in all environments for testing
const IS_DEV = true;

export function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!IS_DEV) return null;

  const handleLogin = async (account: typeof DEV_ACCOUNTS[0]) => {
    setLoggingIn(account.role);
    try {
      if (user) await signOut();
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (error) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            data: { display_name: `Dev ${account.label}`, requested_role: account.role },
          },
        });
        if (signUpError) throw signUpError;
        // Grant 10 questions per subject (110 total) for the new dev account.
        // Granted server-side — the database function is no longer callable from the browser.
        if (signUpData?.session) {
          await supabase.functions.invoke("dev-grant-quota");
        }
        toast({
          title: `Dev ${account.label} created + 110 questions unlocked`,
          description: "10 questions per subject across all 11 subjects.",
        });
      } else {
        toast({ title: `Signed in as ${account.label}` });
        const redirectMap: Record<string, string> = {
          student: "/subjects",
          teacher: "/teacher",
          parent: "/parent",
          admin: "/admin/generate",
        };
        navigate(redirectMap[account.role] || "/");
      }
    } catch (err: any) {
      toast({ title: "Dev login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoggingIn(null);
    }
  };

  const handleCopy = (account: typeof DEV_ACCOUNTS[0]) => {
    navigator.clipboard.writeText(`${account.email} / ${account.password}`);
    setCopied(account.role);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 left-4 z-[9999] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20 transition-transform hover:scale-110 active:scale-95"
        title="Dev Tools"
      >
        <Bug className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-16 left-4 z-[9999] w-80 rounded-xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Dev Tools</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">DEV</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current User</p>
              {user ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate max-w-[180px]">{user.email}</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => signOut()}>
                    Logout
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Not signed in</span>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Login</p>
              <div className="space-y-1.5">
                {DEV_ACCOUNTS.map((account) => (
                  <div key={account.role} className="flex items-center gap-2 rounded-lg border p-2">
                    <span className="text-base">{account.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{account.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{account.email}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(account)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      title="Copy credentials"
                    >
                      {copied === account.role ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 gap-1 text-[10px] px-2"
                      disabled={loggingIn === account.role}
                      onClick={() => handleLogin(account)}
                    >
                      <LogIn className="h-3 w-3" />
                      {loggingIn === account.role ? "..." : "Login"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                All Credentials
              </summary>
              <div className="mt-2 space-y-1 rounded-lg bg-muted/50 p-3 font-mono text-[10px]">
                {DEV_ACCOUNTS.map((a) => (
                  <div key={a.role}>
                    <span className="text-primary">{a.label}:</span>{" "}
                    <span className="text-muted-foreground">{a.email}</span>{" "}
                    <span className="text-foreground">/ {a.password}</span>
                  </div>
                ))}
              </div>
            </details>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Quick Nav</p>
              <div className="flex flex-wrap gap-1">
                {["/", "/subjects", "/dashboard", "/auth", "/admin/generate", "/teacher", "/parent", "/settings", "/pricing"].map((path) => (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setOpen(false); }}
                    className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {path}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
