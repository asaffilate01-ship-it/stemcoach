import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useSession() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [sessionValid, setSessionValid] = useState(true);

  const registerSession = useCallback(async () => {
    if (!user || !session) return;

    const token = session.access_token.slice(-16); // last 16 chars as identifier
    const deviceInfo = navigator.userAgent.slice(0, 100);

    // Upsert — unique on user_id means old session is replaced
    const { error } = await supabase
      .from("active_sessions")
      .upsert({
        user_id: user.id,
        session_token: token,
        device_info: deviceInfo,
        last_active: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) console.error("Session register error:", error);
  }, [user, session]);

  const validateSession = useCallback(async () => {
    if (!user || !session) return true;

    const token = session.access_token.slice(-16);
    const { data } = await supabase
      .from("active_sessions")
      .select("session_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data && data.session_token !== token) {
      setSessionValid(false);
      toast({
        title: "Signed out",
        description: "You've been signed in on another device. Only one session is allowed.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      return false;
    }
    return true;
  }, [user, session, toast]);

  // Register on login
  useEffect(() => {
    registerSession();
  }, [registerSession]);

  // Periodic validation every 30 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(validateSession, 30000);
    return () => clearInterval(interval);
  }, [user, validateSession]);

  // Update last_active periodically
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      await supabase
        .from("active_sessions")
        .update({ last_active: new Date().toISOString() })
        .eq("user_id", user.id);
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return { sessionValid };
}
