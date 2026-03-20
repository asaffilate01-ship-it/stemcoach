CREATE OR REPLACE FUNCTION public.grant_dev_quota(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO user_quotas (user_id, total_questions, used_questions, mock_exams_total, mock_exams_used, subjects, levels)
  VALUES (
    _user_id,
    110,
    0,
    5,
    0,
    ARRAY['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Economics','Literature','Psychology','Geography','Business Studies'],
    ARRAY['GCSE','A-Level']
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_questions = 110,
    used_questions = 0,
    mock_exams_total = 5,
    mock_exams_used = 0,
    subjects = ARRAY['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Economics','Literature','Psychology','Geography','Business Studies'],
    levels = ARRAY['GCSE','A-Level'],
    updated_at = now();
END;
$$;