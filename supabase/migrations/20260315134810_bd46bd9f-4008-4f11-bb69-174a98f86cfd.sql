
-- Badges & achievements table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'achievement',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  requirement_subject text,
  xp_reward integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- User stats for gamification
CREATE TABLE public.user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  perfect_scores integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  subject text,
  achievement_type text NOT NULL,
  score_percent integer,
  verification_code text NOT NULL DEFAULT SUBSTRING(md5(random()::text || now()::text) FROM 1 FOR 12),
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(verification_code)
);

-- RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can verify certificates" ON public.certificates FOR SELECT TO anon USING (true);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
  ('First Steps', 'Answer your first question', '🎯', 'milestone', 'questions_answered', 1, 10),
  ('Getting Started', 'Answer 10 questions', '📝', 'milestone', 'questions_answered', 10, 25),
  ('Century Club', 'Answer 100 questions', '💯', 'milestone', 'questions_answered', 100, 100),
  ('Question Machine', 'Answer 500 questions', '⚡', 'milestone', 'questions_answered', 500, 250),
  ('Knowledge Titan', 'Answer 1000 questions', '🏆', 'milestone', 'questions_answered', 1000, 500),
  ('Hot Streak', '3-day streak', '🔥', 'streak', 'streak', 3, 30),
  ('Week Warrior', '7-day streak', '⚔️', 'streak', 'streak', 7, 75),
  ('Fortnight Force', '14-day streak', '💪', 'streak', 'streak', 14, 150),
  ('Monthly Master', '30-day streak', '👑', 'streak', 'streak', 30, 300),
  ('Sharp Shooter', '80% overall accuracy', '🎪', 'accuracy', 'accuracy', 80, 100),
  ('Precision Pro', '90% overall accuracy', '🎖️', 'accuracy', 'accuracy', 90, 200),
  ('Perfect 10', 'Get a perfect score on any quiz', '⭐', 'achievement', 'perfect_score', 1, 50),
  ('Hat Trick', '3 perfect scores', '🎩', 'achievement', 'perfect_score', 3, 100),
  ('XP Starter', 'Earn 100 XP', '✨', 'xp', 'xp', 100, 0),
  ('XP Collector', 'Earn 1000 XP', '💎', 'xp', 'xp', 1000, 0),
  ('XP Legend', 'Earn 5000 XP', '🌟', 'xp', 'xp', 5000, 0);

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats;
