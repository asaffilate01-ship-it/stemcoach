import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
try {
  await db.exec(`
    CREATE TABLE public.questions (
      question_type text NOT NULL, correct_answer text,
      correct_answers text[], model_answer text, mark_scheme text,
      max_marks integer, academic_verified_at timestamptz,
      academic_verified_by uuid, review_status text NOT NULL
    );
    INSERT INTO public.questions VALUES
      ('mcq', 'synthetic key', NULL, NULL, NULL, NULL, now(), '00000000-0000-4000-8000-000000000001', 'published'),
      ('mcq', ' ', NULL, NULL, NULL, NULL, NULL, NULL, 'published'),
      ('multi-select', '', ARRAY['key one','key two'], NULL, NULL, NULL, NULL, NULL, 'published'),
      ('multi-select', 'legacy key', ARRAY['key one',''], NULL, NULL, NULL, NULL, NULL, 'published'),
      ('multi-select', '', NULL, NULL, NULL, NULL, NULL, NULL, 'published'),
      ('essay', '', NULL, 'model', 'rubric', 4, NULL, NULL, 'published'),
      ('essay', 'legacy key', NULL, 'model', '', 4, now(), NULL, 'published'),
      ('essay', '', NULL, NULL, NULL, NULL, NULL, NULL, 'needs_review');
  `);
  const sql = await readFile(new URL("../docs/staging/question-publication-audit.sql", import.meta.url), "utf8");
  const { rows } = await db.query(sql);
  const normalised = rows.map(({question_type,...counts}) => ({
    question_type,
    ...Object.fromEntries(Object.entries(counts).map(([key,value])=>[key,Number(value)])),
  }));
  assert.deepEqual(normalised, [
    {question_type:"essay",published_count:2,empty_primary_count:1,empty_primary_with_alternatives:0,empty_primary_with_rubric:1,incomplete_format_fields:1,verification_recorded_count:0,mock_selector_type_count:0,mock_selector_missing_primary:0},
    {question_type:"mcq",published_count:2,empty_primary_count:1,empty_primary_with_alternatives:0,empty_primary_with_rubric:0,incomplete_format_fields:1,verification_recorded_count:1,mock_selector_type_count:2,mock_selector_missing_primary:1},
    {question_type:"multi-select",published_count:3,empty_primary_count:2,empty_primary_with_alternatives:1,empty_primary_with_rubric:0,incomplete_format_fields:2,verification_recorded_count:0,mock_selector_type_count:0,mock_selector_missing_primary:0},
  ]);
  assert.equal(Number((await db.query("SELECT count(*) AS count FROM public.questions")).rows[0].count), 8);
  assert.ok(!JSON.stringify(normalised).includes("synthetic key"));
  console.log("Publication audit fixture passed: format-aware counts, draft exclusion, verification metadata and no answer text.");
} finally {
  await db.close();
}
