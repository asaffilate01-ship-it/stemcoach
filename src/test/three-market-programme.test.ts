import { describe, expect, it } from "vitest";
import { coreSubjectTracks, marketProgramme, questionTarget } from "../data/threeMarketProgramme";

describe("three-market planning scope", () => {
  it("allocates exactly one million target items across only the three launch markets", () => {
    expect(questionTarget).toBe(1000000);
    expect(marketProgramme.map(m => m.country)).toEqual(["PK", "GB", "DE"]);
    expect(marketProgramme[2].regions).toHaveLength(16);
    expect(marketProgramme[1].regions).toHaveLength(4);
    expect(marketProgramme[0].languages).toEqual(["arabic", "urdu", "welsh"]);
    expect(new Set(coreSubjectTracks).size).toBe(coreSubjectTracks.length);
  });
});
