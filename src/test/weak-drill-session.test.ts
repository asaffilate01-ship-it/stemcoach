import { describe, expect, it } from "vitest";
import { listDrillTopics, parseDrillOptions, selectDrillQuestions } from "@/lib/weakDrillSession";

const questions = [
  { id: "one", subject: "mathematics", topic: "Fractions" },
  { id: "two", subject: "mathematics", topic: "Fractions" },
  { id: "three", subject: "physics", topic: "Fractions" },
  { id: "two", subject: "mathematics", topic: "Fractions" },
  { id: "four", subject: "physics", topic: "Motion" },
];

describe("weak topic drill session", () => {
  it("handles malformed and non-array option data without crashing", () => {
    expect(parseDrillOptions('["One","Two"]')).toEqual(["One", "Two"]);
    expect(parseDrillOptions(["A", null, "", "B"])).toEqual(["A", "B"]);
    expect(parseDrillOptions("{invalid")).toEqual([]);
    expect(parseDrillOptions('{"answer":"secret"}')).toEqual([]);
    expect(parseDrillOptions(null)).toEqual([]);
  });

  it("never combines identical topic labels from different subjects", () => {
    expect(selectDrillQuestions(questions, { subject: "physics", topic: "Fractions" }).map(q => q.id)).toEqual(["three"]);
    expect(selectDrillQuestions(questions, { subject: "mathematics", topic: "Fractions" }).map(q => q.id)).toEqual(["one", "two"]);
  });

  it("keeps stable question order, removes duplicate IDs and supports all-topic sessions", () => {
    expect(selectDrillQuestions(questions).map(q => q.id)).toEqual(["one", "two", "three", "four"]);
    expect(selectDrillQuestions(questions, { subject: "chemistry", topic: "Unknown" })).toEqual([]);
  });

  it("shows accurate unique-question counts per subject and topic", () => {
    expect(listDrillTopics(questions)).toEqual([
      { subject: "mathematics", topic: "Fractions", questionCount: 2 },
      { subject: "physics", topic: "Fractions", questionCount: 1 },
      { subject: "physics", topic: "Motion", questionCount: 1 },
    ]);
  });
});
