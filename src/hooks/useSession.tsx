import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// Generate a stable session ID per browser tab
function getTabSessionId(): string {
  let id = sessionStorage.getItem("stem_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("stem_session_id", id);
  }
  return id;
}

export function useSession() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [sessionValid, setSessionValid] = useState(true);
  const registeredRef = useRef(false);

  const tabSessionId = useRef(getTabSessionId());

  const registerSession = useCallback(async () => {
    if (!user || registeredRef.current) return;
    registeredRef.current = true;

    const deviceInfo = navigator.userAgent.slice(0, 100);

    await supabase.rpc("register_session", {
      _user_id: user.id,
      _session_token: tabSessionId.current,
      _device_info: deviceInfo,
    });
  }, [user]);

  const validateSession = useCallback(async () => {
    if (!user) return true;

    const { data: isValid } = await supabase.rpc("validate_session", {
      _user_id: user.id,
      _session_token: tabSessionId.current,
    });

    if (isValid === false) {
      setSessionValid(false);
      toast({
        title: "Signed out",
        description: "You've been signed in on another device. Only one session is allowed at a time.",
        variant: "destructive",
      });
      // Clear the session ID so re-login generates a new one
      sessionStorage.removeItem("stem_session_id");
      await supabase.auth.signOut();
      return false;
    }
    return true;
  }, [user, toast]);

  // Register on login
  useEffect(() => {
    if (user) {
      registeredRef.current = false;
      tabSessionId.current = getTabSessionId();
      registerSession();
    }
  }, [user, registerSession]);

  // Validate every 15 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(validateSession, 15000);
    return () => clearInterval(interval);
  }, [user, validateSession]);

  // Update last_active every 60 seconds
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
