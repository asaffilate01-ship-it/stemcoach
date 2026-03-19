// Legacy wrapper — redirects to useQuotaGate
import { useQuotaGate } from "./useQuotaGate";

export function useSubscriptionGate() {
  const quota = useQuotaGate();

  return {
    isFree: !quota.hasPurchased,
    canPractice: quota.canPractice,
    canUseAITutor: quota.canUseCoaching,
    canUseCoaching: quota.canUseCoaching,
    canTakeMockExam: quota.canTakeMockExam,
    remainingToday: quota.remainingQuestions,
    todayCount: quota.usedQuestions,
    loading: quota.loading,
    incrementCount: quota.incrementUsed,
    incrementMockExam: quota.incrementMockExam,
    FREE_DAILY_LIMIT: quota.totalQuestions || quota.FREE_QUESTIONS_PER_SUBJECT,
    canPracticeSubjectFree: quota.canPracticeSubjectFree,
    getFreeRemainingForSubject: quota.getFreeRemainingForSubject,
    mockExamsRemaining: quota.mockExamsRemaining,
    mockExamsTotal: quota.mockExamsTotal,
    mockExamsUsed: quota.mockExamsUsed,
  };
}
