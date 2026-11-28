-- Isolated synthetic database fixture, not an active Supabase migration.
-- The harness must create an empty stemcoach_selector_fixture schema and marker.
DO $selector_guard$
BEGIN
  IF current_setting('stemcoach.fixture_mode',true) IS DISTINCT FROM 'isolated-selector-v1' THEN
    RAISE EXCEPTION 'Use the isolated selector fixture harness';
  END IF;
END;
$selector_guard$;

CREATE TABLE stemcoach_selector_fixture.questions (
  id uuid PRIMARY KEY, subject text NOT NULL, curriculum text NOT NULL, boards text[] NOT NULL,
  question_type text NOT NULL, review_status text NOT NULL,
  academic_verified_at timestamptz, academic_verified_by uuid,
  question_text text NOT NULL, topic text NOT NULL, difficulty integer NOT NULL, points integer NOT NULL,
  options jsonb, correct_answer text NOT NULL
);
ALTER TABLE stemcoach_selector_fixture.questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA stemcoach_selector_fixture FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA stemcoach_selector_fixture TO service_role;
REVOKE ALL ON stemcoach_selector_fixture.questions FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON stemcoach_selector_fixture.questions TO service_role;
CREATE POLICY selector_server_only ON stemcoach_selector_fixture.questions
  FOR SELECT TO service_role USING (true);

-- Trim Unicode whitespace used by the browser and normalise compatibility
-- characters. Database lower() collation must be compared with JS in staging.
CREATE FUNCTION stemcoach_selector_fixture.canonical_choice(p_value text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $choice_normalisation$
  SELECT lower(btrim(normalize(p_value,NFKC),
    E' \t\n\r\f\v' || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) ||
    chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) ||
    chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) ||
    chr(12288) || chr(65279)));
$choice_normalisation$;

-- Decode an array or one historical string-encoded array. Fail closed on
-- malformed JSONB input (including invalid Unicode escape sequences).
-- Return original choice text, never the private key or its normalised value.
CREATE FUNCTION stemcoach_selector_fixture.usable_options(p_options jsonb,p_key text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $option_validation$
DECLARE
  v_options jsonb;
  v_text text;
  v_choice jsonb;
  v_value text;
  v_normalised text;
  v_seen text[] := ARRAY[]::text[];
  v_key text;
BEGIN
  IF p_options IS NULL OR p_key IS NULL OR length(p_key)>2000 THEN RETURN NULL; END IF;
  IF jsonb_typeof(p_options)='array' THEN
    v_options:=p_options;
  ELSIF jsonb_typeof(p_options)='string' THEN
    v_text:=p_options #>> '{}';
    IF length(v_text)>100000 OR NOT pg_input_is_valid(v_text,'jsonb') THEN RETURN NULL; END IF;
    v_options:=v_text::jsonb;
  ELSE
    RETURN NULL;
  END IF;
  IF jsonb_typeof(v_options)<>'array' THEN RETURN NULL; END IF;
  IF jsonb_array_length(v_options) NOT BETWEEN 2 AND 8 THEN RETURN NULL; END IF;
  v_key:=stemcoach_selector_fixture.canonical_choice(p_key);
  IF v_key='' THEN RETURN NULL; END IF;
  FOR v_choice IN SELECT value FROM jsonb_array_elements(v_options) LOOP
    IF jsonb_typeof(v_choice)<>'string' THEN RETURN NULL; END IF;
    v_value:=v_choice #>> '{}';
    -- The byte bound is deliberately conservative versus JS UTF-16 length.
    IF octet_length(v_value)>2000 THEN RETURN NULL; END IF;
    v_normalised:=stemcoach_selector_fixture.canonical_choice(v_value);
    IF v_normalised='' OR v_normalised=ANY(v_seen) THEN RETURN NULL; END IF;
    v_seen:=array_append(v_seen,v_normalised);
  END LOOP;
  IF NOT (v_key=ANY(v_seen)) THEN RETURN NULL; END IF;
  RETURN v_options;
END;
$option_validation$;

-- Server-only prototype. Authenticated identity, entitlement and approved
-- template must be checked by a future trusted caller. This is a read-only
-- selection helper, not session issuance, grading, or an allowance debit.
-- Restrict to independently recorded verification and single-answer MCQs.
CREATE FUNCTION stemcoach_selector_fixture.select_quality_mock_sheet(
  p_subject text,p_curriculum text,p_board text,p_count integer
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $quality_selector$
DECLARE
  v_result jsonb;
BEGIN
  IF p_subject IS NULL OR btrim(p_subject)='' OR length(p_subject)>100
    OR p_curriculum IS NULL OR btrim(p_curriculum)='' OR length(p_curriculum)>100
    OR (p_board IS NOT NULL AND (btrim(p_board)='' OR length(p_board)>150))
    OR p_count IS NULL OR p_count NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid examination selector request' USING ERRCODE='22023';
  END IF;
  WITH eligible AS MATERIALIZED (
    SELECT q.id,q.question_text,q.topic,q.subject,q.difficulty,q.points,
      stemcoach_selector_fixture.usable_options(q.options,q.correct_answer) AS options
    FROM stemcoach_selector_fixture.questions q
    WHERE q.subject=p_subject AND q.curriculum=p_curriculum
      AND (p_board IS NULL OR p_board=ANY(q.boards))
      AND q.review_status='published' AND q.question_type='mcq'
      AND q.academic_verified_at IS NOT NULL AND q.academic_verified_by IS NOT NULL
      AND octet_length(q.question_text) BETWEEN 1 AND 12000
      AND stemcoach_selector_fixture.canonical_choice(q.question_text)<>''
      AND octet_length(q.topic) BETWEEN 1 AND 1000
      AND stemcoach_selector_fixture.canonical_choice(q.topic)<>''
      AND q.difficulty BETWEEN 1 AND 5 AND q.points BETWEEN 1 AND 10000
  ), selected AS (
    -- Stable order for synthetic tests only; not a production sampling policy.
    SELECT * FROM eligible WHERE options IS NOT NULL ORDER BY id LIMIT p_count
  )
  SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.id),'[]'::jsonb)
    INTO v_result FROM selected s;
  IF jsonb_array_length(v_result)<>p_count THEN
    RAISE EXCEPTION 'Insufficient eligible verified exam questions' USING ERRCODE='22023';
  END IF;
  RETURN v_result;
END;
$quality_selector$;
REVOKE ALL ON FUNCTION stemcoach_selector_fixture.canonical_choice(text),
  stemcoach_selector_fixture.usable_options(jsonb,text),
  stemcoach_selector_fixture.select_quality_mock_sheet(text,text,text,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION stemcoach_selector_fixture.canonical_choice(text),
  stemcoach_selector_fixture.usable_options(jsonb,text),
  stemcoach_selector_fixture.select_quality_mock_sheet(text,text,text,integer) TO service_role;
