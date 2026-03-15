import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface QuizTimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

export function QuizTimer({ isRunning, onTimeUpdate }: QuizTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        onTimeUpdate?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  useEffect(() => {
    if (!isRunning) setSeconds(0);
  }, [isRunning]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold ${
      seconds > 120 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
    }`}>
      <Clock className="h-3.5 w-3.5" />
      {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}
