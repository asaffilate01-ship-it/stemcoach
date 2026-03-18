// Legacy wrapper — redirects to useQuotaGate
import { useQuotaGate } from "./useQuotaGate";

export function useSubscriptionGate() {
  const quota = useQuotaGate();

  return {
    isFree: !quota.hasPurchased,
    canPractice: quota.canPractice,
    canUseAITutor: quota.canUseAITutor,
    remainingToday: quota.remainingQuestions,
    todayCount: quota.usedQuestions,
    loading: quota.loading,
    incrementCount: quota.incrementUsed,
    FREE_DAILY_LIMIT: quota.totalQuestions || 5,
  };
}
