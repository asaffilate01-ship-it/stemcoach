import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendLocalNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if (permission !== "granted") return;
      new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
      });
    },
    [permission]
  );

  // Listen for new in-app notifications and show browser notification
  useEffect(() => {
    if (!user || permission !== "granted") return;

    const channel = supabase
      .channel("push-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          sendLocalNotification(n.title, n.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, sendLocalNotification]);

  // Daily study reminder - check at 6pm
  useEffect(() => {
    if (!user || permission !== "granted") return;

    const checkReminder = async () => {
      const now = new Date();
      if (now.getHours() !== 18) return;

      const today = now.toISOString().slice(0, 10);
      const { data } = await supabase
        .from("study_goals")
        .select("completed_questions, target_questions")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (data && data.completed_questions < data.target_questions) {
        sendLocalNotification(
          "📚 Study Reminder",
          `You've completed ${data.completed_questions}/${data.target_questions} questions today. Keep going!`
        );
      }
    };

    const interval = setInterval(checkReminder, 60 * 60 * 1000); // check every hour
    checkReminder();
    return () => clearInterval(interval);
  }, [user, permission, sendLocalNotification]);

  return { permission, requestPermission, sendLocalNotification };
}
