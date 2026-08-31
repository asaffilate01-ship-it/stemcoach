import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260831030000_secure_quiz_assignments.sql");
const answerChecker = read("supabase/functions/check-answer/index.ts");
const assignmentQuiz = read("src/pages/AssignmentQuiz.tsx");
const studentClasses = read("src/pages/StudentClasses.tsx");
const teacherDashboard = read("src/pages/TeacherDashboard.tsx");
const routes = read("src/App.tsx");
const locales = [read("src/i18n/locales/en.ts"), read("src/i18n/locales/fr.ts"), read("src/i18n/locales/de.ts")];

describe("secure resumable quiz assignments", () => {
  it("freezes reviewed, auto-gradable questions when a teacher creates a quiz", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.assignment_questions");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.create_quiz_assignment");
    expect(migration).toContain("question.review_status = 'published'");
    expect(migration).toContain("question.question_type NOT IN ('essay', 'multi-step')");
    expect(migration).toContain("selected_count <> _question_count");
    expect(migration).toContain("row_number() OVER (ORDER BY candidate.topic_priority, candidate.sort_key)");
    expect(migration).toContain("Class not found or not owned by teacher");
    expect(teacherDashboard).toContain('rpc("create_quiz_assignment"');
    expect(teacherDashboard).not.toContain('.from("assignments").insert');
  });

  it("returns safe assignment questions without canonical answers", () => {
    const sessionFunction = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.get_assignment_session"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.record_assignment_answer"),
    );
    expect(sessionFunction).toContain("question.question_text");
    expect(sessionFunction).toContain("question.options");
    expect(sessionFunction).not.toContain("correct_answer");
    expect(sessionFunction).not.toContain("worked_solution");
    expect(sessionFunction).not.toContain("explanation");
  });

  it("records assignment answers and attempts atomically through a service-only RPC", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.assignment_answers");
    expect(migration).toContain("UNIQUE (submission_id, question_id)");
    expect(migration).toContain("INSERT INTO public.attempts");
    expect(migration).toContain("INSERT INTO public.assignment_answers");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON public.assignment_submissions FROM authenticated");
    expect(answerChecker).toContain('admin.rpc("record_assignment_answer"');
  });

  it("validates assignment membership and bypasses personal quota only for assigned work", () => {
    expect(answerChecker).toContain('.from("assignment_questions")');
    expect(answerChecker).toContain('.from("class_members")');
    expect(answerChecker).toContain("if (!assignmentId)");
    expect(answerChecker).toContain("if (!assignmentId && quota?.total_questions > 0)");
    expect(answerChecker).toContain("Question has already been answered");
  });

  it("uses a distributed database rate limit instead of process memory", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.answer_request_windows");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.consume_answer_rate_limit");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(answerChecker).toContain('admin.rpc("consume_answer_rate_limit"');
    expect(answerChecker).not.toContain("new Map<string");
  });

  it("ships a routed resumable learner quiz and verified teacher reporting", () => {
    expect(routes).toContain('path="/assignment/:assignmentId"');
    expect(assignmentQuiz).toContain('rpc("get_assignment_session"');
    expect(assignmentQuiz).toContain('assignment_id: assignmentId');
    expect(assignmentQuiz).toContain('action: "explain"');
    expect(studentClasses).toContain("/assignment/${a.id}");
    expect(studentClasses).not.toContain('.from("assignment_submissions").insert');
    expect(teacherDashboard).toContain('rpc("get_teacher_assignment_results"');
  });

  it("translates the complete assignment journey in every supported language", () => {
    for (const locale of locales) {
      expect(locale).toContain("assignmentQuiz: {");
      expect(locale).toContain("teacherCanSee:");
      expect(locale).toContain("learnersCompleted:");
      expect(locale).toContain("difficultyMin:");
    }
  });
});
