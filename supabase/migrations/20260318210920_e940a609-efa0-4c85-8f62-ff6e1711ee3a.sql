
-- Daily Challenges
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  subject text NOT NULL,
  curriculum text NOT NULL DEFAULT 'uk-gcse',
  question_count integer NOT NULL DEFAULT 10,
  time_limit_seconds integer NOT NULL DEFAULT 600,
  xp_reward integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, subject)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges FOR SELECT TO authenticated USING (true);

-- Daily Challenge Attempts  
CREATE TABLE public.daily_challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  time_taken_seconds integer,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own challenge attempts" ON public.daily_challenge_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own challenge attempts" ON public.daily_challenge_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "All users can view attempts for leaderboard" ON public.daily_challenge_attempts FOR SELECT TO authenticated USING (true);

-- Study Groups
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  join_code text NOT NULL DEFAULT SUBSTRING(md5(random()::text) FROM 1 FOR 6),
  max_members integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view study groups" ON public.study_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create study groups" ON public.study_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own groups" ON public.study_groups FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete own groups" ON public.study_groups FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Study Group Members
CREATE TABLE public.study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view group members" ON public.study_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join groups" ON public.study_group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.study_group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Blog Posts (admin-managed)
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'study-tips',
  cover_image text,
  author_name text NOT NULL DEFAULT 'STEMCoach Team',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for daily challenge attempts (leaderboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_challenge_attempts;
