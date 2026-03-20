import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getCoachStem, getMascot, guessMascotFromText } from "@/lib/mascots";

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
      // Pick mascot icon from notification content
      const mascot = icon ? undefined : guessMascotFromText(title + " " + body);
      new Notification(title, {
        body,
        icon: icon || mascot?.image || "/assets/coach-stem.png",
        badge: "/pwa-icon-192.png",
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
          // Use mascot icon based on notification metadata or content
          const mascotIcon = n.metadata?.mascot_image || undefined;
          sendLocalNotification(n.title, n.message, mascotIcon);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, sendLocalNotification]);

  // Client-side daily mascot encouragement based on today's activity
  useEffect(() => {
    if (!user || permission !== "granted") return;

    const sendDailyMascotNotification = async () => {
      // Only fire between 6-8 PM local time
      const hour = new Date().getHours();
      if (hour < 18 || hour > 20) return;

      // Check if we already sent today (use localStorage to avoid spam)
      const lastSent = localStorage.getItem("stemcoach_daily_push_date");
      const today = new Date().toISOString().slice(0, 10);
      if (lastSent === today) return;

      // Fetch today's activity
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [attemptsRes, statsRes] = await Promise.all([
        supabase
          .from("attempts")
          .select("id, correct, question_id")
          .eq("user_id", user.id)
          .gte("created_at", todayStart.toISOString()),
        supabase
          .from("user_stats")
          .select("streak, xp, total_questions")
          .eq("user_id", user.id)
          .single(),
      ]);

      const attempts = attemptsRes.data || [];
      const stats = statsRes.data;
      const questionsToday = attempts.length;
      const correctToday = attempts.filter((a) => a.correct).length;
      const accuracy = questionsToday > 0 ? Math.round((correctToday / questionsToday) * 100) : 0;
      const streak = stats?.streak || 0;

      // Pick a mascot based on subject studied today
      let mascot = getCoachStem();
      if (questionsToday > 0) {
        const qIds = [...new Set(attempts.map((a) => a.question_id))];
        const { data: questions } = await supabase
          .from("questions")
          .select("subject")
          .in("id", qIds.slice(0, 10));

        if (questions && questions.length > 0) {
          // Pick the most-studied subject
          const subjectCounts = new Map<string, number>();
          questions.forEach((q) => {
            subjectCounts.set(q.subject, (subjectCounts.get(q.subject) || 0) + 1);
          });
          const topSubject = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          mascot = getMascot(topSubject);
        }
      }

      // Compose personalized mascot message
      let title: string;
      let body: string;

      if (questionsToday === 0) {
        // No activity — gentle nudge
        const nudges = [
          { t: `${mascot.emoji} ${mascot.name} misses you!`, b: mascot.streakLostMessage },
          { t: `${mascot.emoji} Hey, it's ${mascot.name}!`, b: "Haven't seen you today! Even 5 questions keeps your brain sharp. Let's go! 💪" },
          { t: `${mascot.emoji} Quick check-in from ${mascot.name}`, b: `Your ${streak > 0 ? streak + "-day streak is at risk!" : "future streak starts today!"} Jump in for a quick session 🚀` },
        ];
        const pick = nudges[Math.floor(Math.random() * nudges.length)];
        title = pick.t;
        body = pick.b;
      } else if (accuracy >= 80) {
        // Great performance
        const cheers = [
          { t: `🔥 ${mascot.name} is impressed!`, b: `${questionsToday} questions at ${accuracy}% accuracy today! ${mascot.cheerMessage}` },
          { t: `⭐ ${mascot.name}: You're on fire!`, b: `${correctToday}/${questionsToday} correct today! Keep this up and exam day will be a breeze! 🎯` },
          { t: `🏆 ${mascot.name} says WOW!`, b: `${accuracy}% accuracy across ${questionsToday} questions. The Squad is proud of you! 🌟` },
        ];
        const pick = cheers[Math.floor(Math.random() * cheers.length)];
        title = pick.t;
        body = pick.b;
      } else if (accuracy >= 50) {
        // Decent performance
        const encouragements = [
          { t: `${mascot.emoji} ${mascot.name}: Good effort!`, b: `${questionsToday} questions done with ${accuracy}% accuracy. Review the ones you missed to level up! 📈` },
          { t: `${mascot.emoji} Keep going!`, b: `${correctToday}/${questionsToday} right today. Practice makes perfect — try the weak topic drills! 💪` },
          { t: `${mascot.emoji} Almost there!`, b: `${accuracy}% today — you're improving! Check your Focus Areas to push past 80% 🎯` },
        ];
        const pick = encouragements[Math.floor(Math.random() * encouragements.length)];
        title = pick.t;
        body = pick.b;
      } else {
        // Needs work
        const supports = [
          { t: `${mascot.emoji} ${mascot.name}: Don't give up!`, b: `${questionsToday} questions tackled today — that's what counts! Review the explanations and try again. You've got this! 🧠` },
          { t: `${mascot.emoji} Every mistake is a lesson!`, b: `${accuracy}% accuracy today, but ${mascot.name} believes in you. Try the worked solutions to understand each step! ✅` },
        ];
        const pick = supports[Math.floor(Math.random() * supports.length)];
        title = pick.t;
        body = pick.b;
      }

      // Add streak info
      if (streak > 2 && questionsToday > 0) {
        body += ` 🔥 ${streak}-day streak!`;
      }

      sendLocalNotification(title, body, mascot.image);
      localStorage.setItem("stemcoach_daily_push_date", today);
    };

    // Check every 30 minutes
    const interval = setInterval(sendDailyMascotNotification, 30 * 60 * 1000);
    // Also check on mount (delayed slightly)
    const timeout = setTimeout(sendDailyMascotNotification, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user, permission, sendLocalNotification]);

  return { permission, requestPermission, sendLocalNotification };
}
