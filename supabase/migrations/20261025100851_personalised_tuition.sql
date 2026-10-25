CREATE FUNCTION public.tuition_can_manage(p_context uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.classes c WHERE c.id=p_context AND c.teacher_id=auth.uid() AND public.has_role(auth.uid(),'teacher')) $$;
CREATE FUNCTION public.tuition_active(p_context uuid,p_student uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id=cm.class_id WHERE c.id=p_context AND cm.user_id=p_student AND public.has_role(p_student,'student')) $$;
CREATE FUNCTION public.get_tuition_roster() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT coalesce(jsonb_agg(x ORDER BY x.module_id,x.student_id),'[]'::jsonb) FROM (SELECT c.id module_id,c.name module_title,cm.user_id student_id,coalesce(p.display_name,'Learner') student_name,public.tuition_can_manage(c.id) can_teach FROM public.classes c JOIN public.class_members cm ON cm.class_id=c.id JOIN public.profiles p ON p.user_id=cm.user_id WHERE public.tuition_active(c.id,cm.user_id) AND (cm.user_id=auth.uid() OR public.tuition_can_manage(c.id))) x $$;
-- Formative tuition only: never writes summative assessment or released grades.
CREATE TABLE public.tuition_learning_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), module_id uuid NOT NULL REFERENCES public.classes(id),
 student_id uuid NOT NULL REFERENCES auth.users(id), goal text NOT NULL CHECK(length(btrim(goal)) BETWEEN 10 AND 2000),
 created_by uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(module_id,student_id)
);
CREATE TABLE public.tuition_learning_tasks (
 id uuid PRIMARY KEY, plan_id uuid NOT NULL REFERENCES public.tuition_learning_plans(id),
 skill text NOT NULL CHECK(length(btrim(skill)) BETWEEN 3 AND 160),
 baseline text NOT NULL CHECK(baseline IN ('not_assessed','needs_support','with_hints','independent')),
 diagnostic_evidence text NOT NULL CHECK(length(btrim(diagnostic_evidence)) BETWEEN 15 AND 4000),
 instruction text NOT NULL CHECK(length(btrim(instruction)) BETWEEN 15 AND 6000),
 position int NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL REFERENCES auth.users(id),UNIQUE(plan_id,position)
);
CREATE TABLE public.tuition_learning_attempts (
 id uuid PRIMARY KEY, task_id uuid NOT NULL REFERENCES public.tuition_learning_tasks(id),
 response text NOT NULL CHECK(length(response)<=12000), help_requested boolean NOT NULL DEFAULT false,
 submitted_at timestamptz NOT NULL DEFAULT now(), outcome text CHECK(outcome IN ('needs_support','with_hints','independent')),
 feedback text CHECK(length(btrim(feedback)) BETWEEN 15 AND 4000), reviewed_by uuid REFERENCES auth.users(id), reviewed_at timestamptz,
 CHECK(length(btrim(response))>=10 OR help_requested),CHECK((outcome IS NULL AND feedback IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL) OR (outcome IS NOT NULL AND feedback IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX learning_tasks_plan ON public.tuition_learning_tasks(plan_id);
CREATE INDEX learning_attempts_task ON public.tuition_learning_attempts(task_id,submitted_at DESC);
CREATE UNIQUE INDEX learning_one_pending_attempt ON public.tuition_learning_attempts(task_id) WHERE outcome IS NULL;
CREATE FUNCTION public.can_read_tuition_learning_plan(p_plan uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.tuition_learning_plans p WHERE p.id=p_plan AND
 (public.tuition_active(p.module_id,p.student_id) AND (public.tuition_can_manage(p.module_id) OR p.student_id=auth.uid())))
$$;
CREATE FUNCTION public.can_read_tuition_learning_task(p_task uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.tuition_learning_tasks t WHERE t.id=p_task AND public.can_read_tuition_learning_plan(t.plan_id))
$$;
ALTER TABLE public.tuition_learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_learning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_learning_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tuition_learning_plans,public.tuition_learning_tasks,public.tuition_learning_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tuition_learning_plans,public.tuition_learning_tasks,public.tuition_learning_attempts TO authenticated;
CREATE POLICY "Learning plan authorised participants" ON public.tuition_learning_plans FOR SELECT TO authenticated USING(public.can_read_tuition_learning_plan(id));
CREATE POLICY "Learning tasks authorised participants" ON public.tuition_learning_tasks FOR SELECT TO authenticated USING(public.can_read_tuition_learning_plan(plan_id));
CREATE POLICY "Learning attempts authorised participants" ON public.tuition_learning_attempts FOR SELECT TO authenticated USING(public.can_read_tuition_learning_task(task_id));
CREATE FUNCTION public.create_tuition_learning_plan(p_module uuid,p_student uuid,p_goal text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.tuition_can_manage(p_module) OR NOT public.tuition_active(p_module,p_student) OR p_student=auth.uid() THEN RAISE EXCEPTION 'Assigned tutor and active learner required' USING ERRCODE='42501'; END IF;
 INSERT INTO public.tuition_learning_plans(module_id,student_id,goal,created_by) VALUES(p_module,p_student,btrim(p_goal),auth.uid()) ON CONFLICT(module_id,student_id) DO NOTHING RETURNING id INTO v;
 IF v IS NULL THEN SELECT id INTO v FROM public.tuition_learning_plans WHERE module_id=p_module AND student_id=p_student; END IF;
 RETURN v;
END $$;
CREATE FUNCTION public.add_tuition_learning_task(p_plan uuid,p_id uuid,p_skill text,p_baseline text,p_diagnostic text,p_instruction text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.tuition_learning_plans; t public.tuition_learning_tasks;
BEGIN
 SELECT * INTO p FROM public.tuition_learning_plans WHERE id=p_plan FOR UPDATE;
 IF p.id IS NULL OR auth.uid() IS NULL OR NOT public.tuition_can_manage(p.module_id) OR NOT public.tuition_active(p.module_id,p.student_id) OR p.student_id=auth.uid() THEN RAISE EXCEPTION 'Assigned tutor required' USING ERRCODE='42501'; END IF;
 SELECT * INTO t FROM public.tuition_learning_tasks WHERE id=p_id;
 IF FOUND THEN
 IF (t.plan_id,t.skill,t.baseline,t.diagnostic_evidence,t.instruction,t.created_by) IS DISTINCT FROM (p_plan,btrim(p_skill),p_baseline,btrim(p_diagnostic),btrim(p_instruction),auth.uid()) THEN RAISE EXCEPTION 'Request already used for different task'; END IF;RETURN t.id;END IF;
 INSERT INTO public.tuition_learning_tasks(id,plan_id,skill,baseline,diagnostic_evidence,instruction,position,created_by) VALUES(p_id,p_plan,btrim(p_skill),p_baseline,btrim(p_diagnostic),btrim(p_instruction),(SELECT coalesce(max(position),0)+1 FROM public.tuition_learning_tasks WHERE plan_id=p_plan),auth.uid());RETURN p_id;
END $$;
CREATE FUNCTION public.submit_tuition_learning_attempt(p_task uuid,p_id uuid,p_response text,p_help boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE t public.tuition_learning_tasks; p public.tuition_learning_plans; a public.tuition_learning_attempts;
BEGIN
 SELECT * INTO t FROM public.tuition_learning_tasks WHERE id=p_task FOR UPDATE;
 SELECT * INTO p FROM public.tuition_learning_plans WHERE id=t.plan_id;
 IF auth.uid() IS NULL OR p.student_id IS DISTINCT FROM auth.uid() OR NOT public.tuition_active(p.module_id,p.student_id) THEN RAISE EXCEPTION 'Active enrolled owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.tuition_learning_attempts WHERE id=p_id;
 IF FOUND THEN IF (a.task_id,a.response,a.help_requested) IS DISTINCT FROM (p_task,btrim(p_response),p_help) THEN RAISE EXCEPTION 'Request already used for different response'; END IF;RETURN a.id;END IF;
 IF EXISTS(SELECT 1 FROM public.tuition_learning_attempts WHERE task_id=p_task AND outcome IS NULL) THEN RAISE EXCEPTION 'Await tutor review before another attempt'; END IF;
 INSERT INTO public.tuition_learning_attempts(id,task_id,response,help_requested) VALUES(p_id,p_task,btrim(p_response),p_help);RETURN p_id;
END $$;
CREATE FUNCTION public.review_tuition_learning_attempt(p_attempt uuid,p_outcome text,p_feedback text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.tuition_learning_attempts; p public.tuition_learning_plans;
BEGIN
 SELECT * INTO a FROM public.tuition_learning_attempts WHERE id=p_attempt FOR UPDATE;
 SELECT lp.* INTO p FROM public.tuition_learning_tasks t JOIN public.tuition_learning_plans lp ON lp.id=t.plan_id WHERE t.id=a.task_id;
 IF auth.uid() IS NULL OR p.id IS NULL OR NOT public.tuition_can_manage(p.module_id) OR NOT public.tuition_active(p.module_id,p.student_id) OR p.student_id=auth.uid() THEN RAISE EXCEPTION 'Independent teaching review required' USING ERRCODE='42501'; END IF;
 IF a.outcome IS NOT NULL THEN IF (a.outcome,a.feedback,a.reviewed_by) IS NOT DISTINCT FROM (p_outcome,btrim(p_feedback),auth.uid()) THEN RETURN a.id; END IF;RAISE EXCEPTION 'Review is immutable; assess a new attempt'; END IF;
 UPDATE public.tuition_learning_attempts SET outcome=p_outcome,feedback=btrim(p_feedback),reviewed_by=auth.uid(),reviewed_at=now() WHERE id=p_attempt; RETURN p_attempt;
END $$;

-- A separate, explicitly verified relationship is required before any plan can be shared.
-- Operators populate these links after verifying the guardian relationship in this platform.
CREATE TABLE public.tuition_learning_shares (plan_id uuid REFERENCES public.tuition_learning_plans(id),link_id uuid REFERENCES public.parent_links(id) ON DELETE CASCADE,PRIMARY KEY(plan_id,link_id));
ALTER TABLE public.tuition_learning_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tuition_learning_shares FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.clear_tuition_shares() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF (NEW.status,NEW.child_id,NEW.parent_id) IS DISTINCT FROM (OLD.status,OLD.child_id,OLD.parent_id) THEN DELETE FROM public.tuition_learning_shares WHERE link_id=OLD.id;END IF;RETURN NEW;END $$;
CREATE TRIGGER clear_tuition_shares BEFORE UPDATE ON public.parent_links FOR EACH ROW EXECUTE FUNCTION public.clear_tuition_shares();
CREATE FUNCTION public.set_tuition_learning_share(p_plan uuid,p_link uuid,p_share boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.tuition_learning_plans; l public.parent_links;
BEGIN
 SELECT * INTO p FROM public.tuition_learning_plans WHERE id=p_plan;
 SELECT * INTO l FROM public.parent_links WHERE id=p_link FOR UPDATE;
 IF auth.uid() IS NULL OR p.id IS NULL OR l.id IS NULL OR p.student_id IS DISTINCT FROM auth.uid() OR l.child_id IS DISTINCT FROM auth.uid() OR p_share IS NULL THEN RAISE EXCEPTION 'Linked learner required';END IF;
 IF NOT p_share THEN DELETE FROM public.tuition_learning_shares WHERE plan_id=p_plan AND link_id=p_link;RETURN false;END IF;
 IF NOT (l.status='approved') OR NOT public.tuition_active(p.module_id,p.student_id) THEN RAISE EXCEPTION 'Verified guardian and active enrolment required';END IF;
 INSERT INTO public.tuition_learning_shares VALUES(p_plan,p_link) ON CONFLICT DO NOTHING;RETURN true;
END $$;
CREATE FUNCTION public.get_tuition_learning_share_options(p_plan uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',l.id,'name',(SELECT coalesce(pr.display_name,'Guardian') FROM public.profiles pr WHERE pr.user_id=l.parent_id),'verified',(l.status='approved'),'shared',EXISTS(SELECT 1 FROM public.tuition_learning_shares s WHERE s.plan_id=p_plan AND s.link_id=l.id))),'[]'::jsonb)
 FROM public.parent_links l WHERE auth.uid() IS NOT NULL AND l.child_id=auth.uid() AND EXISTS(SELECT 1 FROM public.tuition_learning_plans p WHERE p.id=p_plan AND p.student_id=auth.uid() AND public.tuition_active(p.module_id,p.student_id))
$$;
CREATE FUNCTION public.get_tuition_guardian_learning() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'student_name',(SELECT coalesce(pr.display_name,'Learner') FROM public.profiles pr WHERE pr.user_id=p.student_id),'goal',p.goal,'skills',coalesce((SELECT jsonb_agg(jsonb_build_object('skill',t.skill,'outcome',(SELECT a.outcome FROM public.tuition_learning_attempts a WHERE a.task_id=t.id AND a.outcome IS NOT NULL ORDER BY a.submitted_at DESC,a.id DESC LIMIT 1))) FROM public.tuition_learning_tasks t WHERE t.plan_id=p.id),'[]'::jsonb))),'[]'::jsonb)
 FROM public.tuition_learning_shares s JOIN public.parent_links l ON l.id=s.link_id JOIN public.tuition_learning_plans p ON p.id=s.plan_id AND p.student_id=l.child_id
 WHERE auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'parent') AND l.parent_id=auth.uid() AND (l.status='approved') AND public.tuition_active(p.module_id,p.student_id)
$$;

REVOKE ALL ON FUNCTION public.can_read_tuition_learning_plan(uuid),public.can_read_tuition_learning_task(uuid),public.get_tuition_roster(),public.create_tuition_learning_plan(uuid,uuid,text),public.add_tuition_learning_task(uuid,uuid,text,text,text,text),public.submit_tuition_learning_attempt(uuid,uuid,text,boolean),public.review_tuition_learning_attempt(uuid,text,text),public.set_tuition_learning_share(uuid,uuid,boolean),public.get_tuition_learning_share_options(uuid),public.get_tuition_guardian_learning(),public.tuition_can_manage(uuid),public.tuition_active(uuid,uuid),public.clear_tuition_shares() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_tuition_learning_plan(uuid),public.can_read_tuition_learning_task(uuid),public.get_tuition_roster(),public.create_tuition_learning_plan(uuid,uuid,text),public.add_tuition_learning_task(uuid,uuid,text,text,text,text),public.submit_tuition_learning_attempt(uuid,uuid,text,boolean),public.review_tuition_learning_attempt(uuid,text,text),public.set_tuition_learning_share(uuid,uuid,boolean),public.get_tuition_learning_share_options(uuid),public.get_tuition_guardian_learning() TO authenticated;

CREATE INDEX tuition_plans_student_idx ON public.tuition_learning_plans(student_id);
