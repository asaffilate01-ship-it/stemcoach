import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPack } from "./reconcile-private-bank.mjs";
import { buildReviewWorklist, evaluateReviewHandoff, REVIEW_SCOPE } from "./private-review-handoff.mjs";

async function writePrivate(path, value) {
  const root=await realpath(resolve(dirname(fileURLToPath(import.meta.url)),".."));
  const target=resolve(await realpath(dirname(resolve(path))),basename(path));
  const rel=relative(root,target);
  if(!rel.startsWith(".."+sep)||isAbsolute(rel))throw Error("Private output required");
  await writeFile(target,JSON.stringify(value,null,2)+"\n",{flag:"wx",mode:0o600});
}
try {
  const [action,path,...dirs]=process.argv.slice(2);
  if(!["worklist","check"].includes(action)||!path||!dirs.length||dirs.length>200)throw Error("usage");
  const packs=[];
  for(const dir of dirs)packs.push(await loadPack(dir));
  if(action==="worklist"){
    const work=buildReviewWorklist(packs);
    if(!work.valid){process.stdout.write(JSON.stringify(work.reconciliation,null,2)+"\n");process.exitCode=1;}
    else {
      await writePrivate(path,{schemaVersion:1,scope:REVIEW_SCOPE,status:"draft-review-worklist",items:work.items});
      process.stdout.write(JSON.stringify({valid:true,worklistRows:work.items.length,approvedCount:0,publishedCount:0})+"\n");
    }
  } else {
    if((await stat(path)).size>128*1024*1024)throw Error("oversize");
    const submission=JSON.parse(await readFile(path,"utf8"));
    const {report}=evaluateReviewHandoff(packs,submission);
    process.stdout.write(JSON.stringify(report,null,2)+"\n");
    if(!report.valid)process.exitCode=1;
  }
}catch{
  console.error("Usage: node --experimental-strip-types scripts/review-private-bank.mjs worklist NEW_PRIVATE_FILE.json PACK_DIR... OR check PRIVATE_ATTESTATIONS.json PACK_DIR... . No source or answer text is logged.");
  process.exitCode=1;
}
