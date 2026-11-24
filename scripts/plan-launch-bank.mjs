import { readFile } from "node:fs/promises";
import { inspectLaunchPlan, launchJobWindow, LAUNCH_PLAN_SCOPE } from "../src/lib/launchBankPlan.ts";

try {
  const args = process.argv.slice(2);
  const file = args.shift();
  if (!file || ![0, 2].includes(args.length) || (args.length && (args[0] !== "--jobs" || !/^\d+$/.test(args[1])))) throw new Error("usage");
  const input = JSON.parse(await readFile(file, "utf8"));
  const output = args.length ? { schemaVersion: 1, scope: LAUNCH_PLAN_SCOPE, startCursor: Number(args[1]), ...launchJobWindow(input, Number(args[1])) } : inspectLaunchPlan(input).report;
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  if (!(output.report ?? output).valid) process.exitCode = 1;
} catch {
  // Do not leak source metadata, answers, filesystem paths, or JSON parser fragments to logs.
  console.error("Usage: node --experimental-strip-types scripts/plan-launch-bank.mjs PRIVATE_MANIFEST.json [--jobs CURSOR]. Check the file and arguments.");
  process.exitCode = 1;
}
