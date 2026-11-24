import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { MASCOT_IDENTITIES, STEMCOACH_IDENTITY } from "../../supabase/functions/_shared/mascotCatalog";

const originals = {
  "coach-stem": "2b6af16bbc607913114a5c0466a5a062d8412939",
  "mathmax": "288b0744779d07855831d42f4799d3c87f91730c",
  "physix": "1248d9082d096c606f3cf7c33e307b09fdb6060c",
  "chemi": "4f859675d558fb4615bb71731b22e314ce159bf5",
  "biobee": "771e0789410b9fc6b85c17dd9b44c406f37b363a",
  "codey": "6ada40878d57e75439972d72411dd986dacf18b8",
  "lexi": "b38db61c2ec4109827913f4311808d42bd661aff",
  "hans": "e2bc7cd10a90a432fc83904ae06f18ed74546bd1",
  "francois": "21caa5681d83c7ded5effeae9bbeff7bc3ddccac",
  "bizpro": "2d358b52affe09ad482e3825ff31114b74cfb1d0",
  "econiq": "2ff22830f1cf394e93662a8597f3367f11ba2a9d",
  "litera": "7f325f261ae9a2cb2b088d980e7a0fe2bf20d006",
  "psyche": "d574f4ca3d1db6292b40559b89d921280705232d",
  "geo": "5e8f87881623f5a0bbb60cc2716d7aa8266affc2"
} as const;

describe("original STEM Squad artwork", () => {
  it("uses exactly the fourteen canonical original avatars", () => {
    const paths = new Set([STEMCOACH_IDENTITY, ...Object.values(MASCOT_IDENTITIES)].map(m => m.image));
    expect([...paths].sort()).toEqual(Object.keys(originals).map(n => "/assets/" + n + ".png").sort());
  });
  for (const [name, expected] of Object.entries(originals)) {
    it("preserves " + name + " byte for byte", () => {
      const bytes = readFileSync(new URL("../../public/assets/" + name + ".png", import.meta.url));
      const hash = createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex");
      expect(hash).toBe(expected);
    });
  }
});
